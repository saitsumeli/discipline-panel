import type { AuthError } from "@supabase/supabase-js";
import {
  SUPABASE_CONFIG_ERROR_MESSAGE,
  SUPABASE_IS_CONFIGURED,
  supabase,
} from "@/app/lib/supabaseClient";

type LoginLookupRow = {
  user_id: string | null;
  email: string | null;
  username: string | null;
  display_name: string | null;
};

type LoginResolutionSuccess = {
  email: string;
  identifierType: "email" | "username";
  username?: string;
};

type LoginResolutionFailure = {
  errorMessage: string;
  reason: "invalid_input" | "not_found" | "missing_email" | "system";
};

type LoginResolution = LoginResolutionSuccess | LoginResolutionFailure;

type UsernameAvailability =
  | { available: true }
  | { available: false; errorMessage: string; reason: "invalid_input" | "taken" | "system" };

const AUTH_SETUP_ERROR_MESSAGE =
  "Giriş sistemi şu an hazır değil. Supabase SQL kurulumunu tamamlayıp tekrar dene.";

function normalizeIdentifier(identifier: string) {
  return identifier.trim().toLowerCase();
}

function isEmailIdentifier(identifier: string) {
  return identifier.includes("@");
}

function isMissingFunctionError(error: { code?: string | null; message?: string | null }) {
  const message = error.message?.toLowerCase() ?? "";

  return (
    error.code === "42883" ||
    message.includes("function") ||
    message.includes("could not find the function")
  );
}

async function lookupLoginIdentifierDirect(
  identifier: string
): Promise<{ row: LoginLookupRow | null; errorMessage?: string }> {
  const column = isEmailIdentifier(identifier) ? "email" : "username";

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, username, display_name")
    .eq(column, identifier)
    .maybeSingle();

  if (error) {
    return {
      row: null,
      errorMessage: AUTH_SETUP_ERROR_MESSAGE,
    };
  }

  if (!data) {
    return { row: null };
  }

  return {
    row: {
      user_id: data.id ?? null,
      email: data.email ?? null,
      username: data.username ?? null,
      display_name: data.display_name ?? null,
    },
  };
}

async function lookupLoginIdentifier(
  identifier: string
): Promise<{ row: LoginLookupRow | null; errorMessage?: string }> {
  if (!SUPABASE_IS_CONFIGURED) {
    return {
      row: null,
      errorMessage: SUPABASE_CONFIG_ERROR_MESSAGE,
    };
  }

  const { data, error } = await supabase.rpc("resolve_login_identifier", {
    input_identifier: identifier,
  });

  if (error) {
    if (isMissingFunctionError(error)) {
      return lookupLoginIdentifierDirect(identifier);
    }

    return {
      row: null,
      errorMessage: AUTH_SETUP_ERROR_MESSAGE,
    };
  }

  const rows = Array.isArray(data)
    ? (data as LoginLookupRow[])
    : data
    ? ([data] as LoginLookupRow[])
    : [];

  return {
    row: rows[0] ?? null,
  };
}

export async function resolveLoginIdentifier(
  identifier: string
): Promise<LoginResolution> {
  if (!SUPABASE_IS_CONFIGURED) {
    return {
      errorMessage: SUPABASE_CONFIG_ERROR_MESSAGE,
      reason: "system",
    };
  }

  const normalizedInput = normalizeIdentifier(identifier);

  if (!normalizedInput) {
    return {
      errorMessage: "Kullanıcı adı/e-posta gerekli.",
      reason: "invalid_input",
    };
  }

  if (isEmailIdentifier(normalizedInput)) {
    return {
      email: normalizedInput,
      identifierType: "email",
    };
  }

  const lookupResult = await lookupLoginIdentifier(normalizedInput);

  if (lookupResult.errorMessage) {
    return {
      errorMessage: lookupResult.errorMessage,
      reason: "system",
    };
  }

  if (!lookupResult.row) {
    return {
      errorMessage: "Bu kullanıcı bulunamadı.",
      reason: "not_found",
    };
  }

  if (!lookupResult.row.email) {
    return {
      errorMessage: "Bu kullanıcı için giriş e-postası çözümlenemedi.",
      reason: "missing_email",
    };
  }

  return {
    email: lookupResult.row.email.toLowerCase(),
    identifierType: "username",
    username: lookupResult.row.username?.toLowerCase() ?? undefined,
  };
}

export async function checkUsernameAvailability(
  username: string
): Promise<UsernameAvailability> {
  if (!SUPABASE_IS_CONFIGURED) {
    return {
      available: false,
      errorMessage: SUPABASE_CONFIG_ERROR_MESSAGE,
      reason: "system",
    };
  }

  const normalizedUsername = normalizeIdentifier(username);

  if (!normalizedUsername) {
    return {
      available: false,
      errorMessage: "Kullanıcı adı gerekli.",
      reason: "invalid_input",
    };
  }

  if (isEmailIdentifier(normalizedUsername)) {
    return {
      available: false,
      errorMessage: "Kullanıcı adı e-posta formatında olamaz.",
      reason: "invalid_input",
    };
  }

  const lookupResult = await lookupLoginIdentifier(normalizedUsername);

  if (lookupResult.errorMessage) {
    return {
      available: false,
      errorMessage: lookupResult.errorMessage,
      reason: "system",
    };
  }

  if (lookupResult.row) {
    return {
      available: false,
      errorMessage: "Bu kullanıcı adı zaten kullanımda.",
      reason: "taken",
    };
  }

  return { available: true };
}

export function mapAuthErrorMessage(
  error: Pick<AuthError, "message"> | Error,
  options?: { invalidCredentialsMessage?: string }
) {
  const rawMessage = error.message ?? "Bir hata oluştu.";
  const normalizedMessage = rawMessage.toLowerCase();

  if (normalizedMessage.includes("invalid login credentials")) {
    return options?.invalidCredentialsMessage ?? "Giriş bilgileri hatalı.";
  }

  if (normalizedMessage.includes("email not confirmed")) {
    return "E-posta adresini doğruladıktan sonra giriş yapabilirsin.";
  }

  if (normalizedMessage.includes("user already registered")) {
    return "Bu e-posta zaten kullanımda.";
  }

  if (
    normalizedMessage.includes("duplicate key value") &&
    normalizedMessage.includes("username")
  ) {
    return "Bu kullanıcı adı zaten kullanımda.";
  }

  if (
    normalizedMessage.includes("duplicate key value") &&
    normalizedMessage.includes("email")
  ) {
    return "Bu e-posta zaten kullanımda.";
  }

  if (normalizedMessage.includes("database error saving new user")) {
    return "Kayıt oluşturulamadı. Kullanıcı adı veya e-posta zaten kullanımda olabilir.";
  }

  return rawMessage;
}
