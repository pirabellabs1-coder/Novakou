import { NextResponse } from "next/server";

// MentorSession is not yet available in the current schema migration.
// Returns empty data until sessions are enabled.
export async function GET() {
  return NextResponse.json({ data: [] });
}

export async function POST() {
  return NextResponse.json(
    { error: "La fonctionnalité de sessions mentor n'est pas encore disponible." },
    { status: 503 }
  );
}
