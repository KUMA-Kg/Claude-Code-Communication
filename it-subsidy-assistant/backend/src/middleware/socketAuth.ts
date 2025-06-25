import jwt from 'jsonwebtoken'
import { supabase } from '../config/supabase'
import { logger } from '../utils/logger'

interface SocketUser {
  id: string
  email: string
  companyId: string
  role: string
}

/**
 * Socket.IO用の認証トークン検証
 */
export async function authenticateSocketToken(token: string): Promise<SocketUser | null> {
  try {
    // Bearer トークンの処理
    if (token.startsWith('Bearer ')) {
      token = token.substring(7)
    }

    // JWT検証
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    // ユーザー情報取得
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, company_id, role')
      .eq('id', decoded.sub || decoded.userId)
      .single()

    if (error || !user) {
      logger.error('Socket auth: User not found', error)
      return null
    }

    return {
      id: user.id,
      email: user.email,
      companyId: user.company_id,
      role: user.role
    }

  } catch (error) {
    logger.error('Socket auth error:', error)
    return null
  }
}