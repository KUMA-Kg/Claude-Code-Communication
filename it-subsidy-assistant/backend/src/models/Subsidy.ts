import { supabaseService } from '@/config/database';
import { Subsidy, SubsidySearchParams, Region, Industry, UserFavorite, FavoriteSubsidy } from '@/types/subsidy';
import { logger } from '@/utils/logger';

export class SubsidyModel {
  public static async search(params: SubsidySearchParams): Promise<{
    subsidies: Subsidy[];
    total: number;
  }> {
    try {
      const {
        companySize,
        industry,
        investmentAmount,
        region,
        deadline,
        subsidyRate,
        page = 1,
        limit = 20,
        keyword
      } = params;

      let query = supabaseService
        .from('subsidies')
        .select(`
          id, name, description, category, organizer,
          subsidy_amount_min, subsidy_amount_max, subsidy_rate,
          eligible_companies, eligible_expenses,
          application_start, application_end,
          requirements, application_flow,
          contact_phone, contact_email, contact_website,
          created_at, updated_at, is_active
        `, { count: 'exact' })
        .eq('is_active', true);

      if (companySize) {
        const companySizeMap = {
          'small': '小規模事業者',
          'medium': '中小企業',
          'large': '中堅企業'
        };
        query = query.contains('eligible_companies', [companySizeMap[companySize]]);
      }

      if (investmentAmount) {
        query = query
          .lte('subsidy_amount_min', investmentAmount)
          .gte('subsidy_amount_max', investmentAmount);
      }

      if (subsidyRate) {
        query = query.gte('subsidy_rate', subsidyRate);
      }

      if (deadline) {
        const deadlineDate = new Date(deadline);
        query = query.gte('application_end', deadlineDate.toISOString());
      }

      if (keyword) {
        query = query.or(`name.ilike.%${keyword}%,description.ilike.%${keyword}%,category.ilike.%${keyword}%`);
      }

      if (industry) {
        const { data: subsidyIds } = await supabaseService
          .from('subsidy_industries')
          .select('subsidy_id')
          .eq('industry_code', industry);

        if (subsidyIds && subsidyIds.length > 0) {
          const ids = subsidyIds.map(item => item.subsidy_id);
          query = query.in('id', ids);
        } else {
          return { subsidies: [], total: 0 };
        }
      }

      if (region) {
        const { data: subsidyIds } = await supabaseService
          .from('subsidy_regions')
          .select('subsidy_id')
          .eq('region_code', region);

        if (subsidyIds && subsidyIds.length > 0) {
          const ids = subsidyIds.map(item => item.subsidy_id);
          query = query.in('id', ids);
        } else {
          return { subsidies: [], total: 0 };
        }
      }

      const offset = (page - 1) * Math.min(limit, 100);
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + Math.min(limit, 100) - 1);

      if (error) {
        logger.error('Failed to search subsidies:', error);
        throw new Error('Failed to search subsidies');
      }

      const subsidies = data?.map(this.mapDatabaseSubsidyToSubsidy) || [];

      for (const subsidy of subsidies) {
        if (investmentAmount) {
          subsidy.matchScore = this.calculateMatchScore(subsidy, params);
        }
      }

      subsidies.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

      return {
        subsidies,
        total: count || 0
      };

    } catch (error) {
      logger.error('SubsidyModel.search error:', error);
      throw error;
    }
  }

  public static async findById(id: string): Promise<Subsidy | null> {
    try {
      const { data, error } = await supabaseService
        .from('subsidies')
        .select(`
          id, name, description, category, organizer,
          subsidy_amount_min, subsidy_amount_max, subsidy_rate,
          eligible_companies, eligible_expenses,
          application_start, application_end,
          requirements, application_flow,
          contact_phone, contact_email, contact_website,
          created_at, updated_at, is_active
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return null;
      }

      return this.mapDatabaseSubsidyToSubsidy(data);
    } catch (error) {
      logger.error('SubsidyModel.findById error:', error);
      return null;
    }
  }

  public static async getAllRegions(): Promise<Region[]> {
    try {
      const { data, error } = await supabaseService
        .from('regions')
        .select('code, name, parent_code')
        .order('code');

      if (error) {
        logger.error('Failed to get regions:', error);
        return [];
      }

      return data?.map(region => ({
        code: region.code,
        name: region.name,
        parentCode: region.parent_code
      })) || [];
    } catch (error) {
      logger.error('SubsidyModel.getAllRegions error:', error);
      return [];
    }
  }

  public static async getAllIndustries(): Promise<Industry[]> {
    try {
      const { data, error } = await supabaseService
        .from('industries')
        .select('code, name, parent_code')
        .order('code');

      if (error) {
        logger.error('Failed to get industries:', error);
        return [];
      }

      return data?.map(industry => ({
        code: industry.code,
        name: industry.name,
        parentCode: industry.parent_code
      })) || [];
    } catch (error) {
      logger.error('SubsidyModel.getAllIndustries error:', error);
      return [];
    }
  }

  public static async addToFavorites(userId: string, subsidyId: string): Promise<void> {
    try {
      const { error } = await supabaseService
        .from('user_favorites')
        .insert({
          user_id: userId,
          subsidy_id: subsidyId,
          created_at: new Date().toISOString()
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new Error('Subsidy already in favorites');
        }
        logger.error('Failed to add to favorites:', error);
        throw new Error('Failed to add to favorites');
      }
    } catch (error) {
      logger.error('SubsidyModel.addToFavorites error:', error);
      throw error;
    }
  }

  public static async removeFromFavorites(userId: string, subsidyId: string): Promise<void> {
    try {
      const { error } = await supabaseService
        .from('user_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('subsidy_id', subsidyId);

      if (error) {
        logger.error('Failed to remove from favorites:', error);
        throw new Error('Failed to remove from favorites');
      }
    } catch (error) {
      logger.error('SubsidyModel.removeFromFavorites error:', error);
      throw error;
    }
  }

  public static async getUserFavorites(userId: string): Promise<FavoriteSubsidy[]> {
    try {
      const { data, error } = await supabaseService
        .from('user_favorites')
        .select(`
          created_at,
          subsidies (
            id, name, subsidy_amount_min, subsidy_amount_max
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Failed to get user favorites:', error);
        return [];
      }

      return data?.map((item: any) => ({
        id: item.subsidies?.id,
        name: item.subsidies?.name,
        subsidyAmount: {
          min: item.subsidies?.subsidy_amount_min,
          max: item.subsidies?.subsidy_amount_max
        },
        addedAt: new Date(item.created_at)
      })) || [];
    } catch (error) {
      logger.error('SubsidyModel.getUserFavorites error:', error);
      return [];
    }
  }

  public static async isFavorite(userId: string, subsidyId: string): Promise<boolean> {
    try {
      const { data, error } = await supabaseService
        .from('user_favorites')
        .select('user_id')
        .eq('user_id', userId)
        .eq('subsidy_id', subsidyId)
        .single();

      return !error && !!data;
    } catch (error) {
      return false;
    }
  }

  private static mapDatabaseSubsidyToSubsidy(dbSubsidy: any): Subsidy {
    return {
      id: dbSubsidy.id,
      name: dbSubsidy.name,
      description: dbSubsidy.description,
      category: dbSubsidy.category,
      organizer: dbSubsidy.organizer,
      subsidyAmount: {
        min: dbSubsidy.subsidy_amount_min,
        max: dbSubsidy.subsidy_amount_max
      },
      subsidyRate: dbSubsidy.subsidy_rate,
      eligibleCompanies: dbSubsidy.eligible_companies,
      eligibleExpenses: dbSubsidy.eligible_expenses,
      applicationPeriod: {
        start: new Date(dbSubsidy.application_start),
        end: new Date(dbSubsidy.application_end)
      },
      requirements: dbSubsidy.requirements,
      applicationFlow: dbSubsidy.application_flow,
      contactInfo: {
        phone: dbSubsidy.contact_phone,
        email: dbSubsidy.contact_email,
        website: dbSubsidy.contact_website
      },
      createdAt: new Date(dbSubsidy.created_at),
      updatedAt: new Date(dbSubsidy.updated_at),
      isActive: dbSubsidy.is_active
    };
  }

  private static calculateMatchScore(subsidy: Subsidy, params: SubsidySearchParams): number {
    let score = 0.5;

    if (params.investmentAmount) {
      const { min, max } = subsidy.subsidyAmount;
      if (params.investmentAmount >= min && params.investmentAmount <= max) {
        score += 0.3;
      }
    }

    if (params.subsidyRate && subsidy.subsidyRate >= params.subsidyRate) {
      score += 0.2;
    }

    const now = new Date();
    const daysUntilDeadline = Math.ceil(
      (subsidy.applicationPeriod.end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilDeadline > 30) {
      score += 0.1;
    } else if (daysUntilDeadline > 0) {
      score -= 0.1;
    }

    return Math.min(1.0, Math.max(0.0, score));
  }
}