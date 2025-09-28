import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    // Get total errors
    const { count: activeErrors, error: errorsError } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('severity', 'error');

    if (errorsError) {
      return NextResponse.json({ error: errorsError.message }, { status: 500 });
    }

    // Get warnings today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: warningsToday, error: warningsError } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('severity', 'warning')
      .gte('created_at', today.toISOString());

    if (warningsError) {
      return NextResponse.json({ error: warningsError.message }, { status: 500 });
    }

    // Get logs per hour
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    const { count: logsLastHour, error: logsError } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneHourAgo.toISOString());

    if (logsError) {
      return NextResponse.json({ error: logsError.message }, { status: 500 });
    }

    return NextResponse.json({
      activeErrors,
      warningsToday,
      logsLastHour,
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
