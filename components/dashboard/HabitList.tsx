"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabaseClient";

type Habit = {
  id: string;
  name: string;
  category: string;
};

export default function HabitList() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadHabits() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !isMounted) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", user.id);

      if (!error && data && isMounted) {
        setHabits(data);
      }

      if (isMounted) {
        setLoading(false);
      }
    }

    void loadHabits();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) return <p>Yükleniyor...</p>;

  if (habits.length === 0) {
    return <p className="text-slate-400">Henüz alışkanlık yok.</p>;
  }

  return (
    <div className="space-y-3">
      {habits.map((habit) => (
        <div
          key={habit.id}
          className="rounded-xl bg-slate-800 px-4 py-3"
        >
          <p className="font-medium">{habit.name}</p>
          <p className="text-sm text-slate-400">
            {habit.category}
          </p>
        </div>
      ))}
    </div>
  );
}
