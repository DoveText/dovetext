import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    const invitation = await db.oneOrNone(`
      SELECT 
        ic.*,
        COUNT(icu.id) as current_uses
      FROM invitation_codes ic
      LEFT JOIN invitation_code_uses icu ON ic.code = icu.code
      WHERE ic.code = $1
      GROUP BY ic.code
    `, [code]);

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation code not found' },
        { status: 404 }
      );
    }

    if (!invitation.is_active) {
      return NextResponse.json(
        { error: 'Invitation code is inactive' },
        { status: 400 }
      );
    }

    if (invitation.current_uses >= invitation.max_uses) {
      return NextResponse.json(
        { error: 'Invitation code has been fully used' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      remainingUses: invitation.max_uses - invitation.current_uses
    });
  } catch (error) {
    console.error('Error checking invitation code:', error);
    return NextResponse.json(
      { error: 'Failed to validate invitation code' },
      { status: 500 }
    );
  }
}
