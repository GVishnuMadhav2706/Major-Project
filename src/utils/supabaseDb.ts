import { supabase } from '../supabaseClient';
import { Customer } from '../types';

const STORAGE_KEY = 'telecom_churn_customers';

/**
 * Clean data model parser to map database rows (snake_case) to client models (camelCase)
 */
function mapFromDb(row: any): Customer {
  return {
    id: row.id || String(row.customer_id),
    name: row.name,
    tenure: Number(row.tenure),
    monthlyUsage: Number(row.monthly_usage),
    rechargeAmount: Number(row.recharge_amount),
    planType: row.plan_type,
    contractType: row.contract_type,
    supportCalls: Number(row.support_calls),
    churnProbability: Number(row.churn_probability),
    willChurn: Boolean(row.will_churn),
    riskFactors: Array.isArray(row.risk_factors) ? row.risk_factors : [],
  };
}

/**
 * Map client model to database schema keys
 */
function mapToDb(customer: Customer, userId: string) {
  return {
    id: customer.id,
    user_id: userId,
    name: customer.name,
    tenure: customer.tenure,
    monthly_usage: customer.monthlyUsage,
    recharge_amount: customer.rechargeAmount,
    plan_type: customer.planType,
    contract_type: customer.contractType,
    support_calls: customer.supportCalls,
    churn_probability: customer.churnProbability,
    will_churn: customer.willChurn,
    risk_factors: customer.riskFactors,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Fetch all customers.
 * If user is logged in, tries to pull from the 'telecom_customers' Supabase table.
 * Falls back to localStorage seamlessly.
 */
export async function getDurableCustomers(userId: string | null): Promise<{ data: Customer[]; fromDb: boolean; error?: string }> {
  // If not logged in, fetch from localStorage
  if (!userId) {
    const raw = localStorage.getItem(STORAGE_KEY);
    return { data: raw ? JSON.parse(raw) : [], fromDb: false };
  }

  try {
    const { data, error } = await supabase
      .from('telecom_customers')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.warn('Supabase DB table status indicator: ', error.message);
      // Fallback to local storage if table doesn't exist yet
      const raw = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
      return { 
        data: raw ? JSON.parse(raw) : [], 
        fromDb: false, 
        error: `Supabase table query failed (${error.message}). Synced to local storage instead.` 
      };
    }

    if (data && data.length > 0) {
      return { data: data.map(mapFromDb), fromDb: true };
    } else {
      // If table exists but empty, check if we have local cache to migrate
      const raw = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
      const fallbackData = raw ? JSON.parse(raw) : [];
      return { data: fallbackData, fromDb: true };
    }
  } catch (err: any) {
    console.error('Database connection error:', err);
    const raw = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
    return { 
      data: raw ? JSON.parse(raw) : [], 
      fromDb: false, 
      error: 'Unexpected cloud connection issue. Local fallback engaged.' 
    };
  }
}

/**
 * Saves or updates a subscriber record.
 * Handles primary key upserting dynamically based on schema presence.
 */
export async function saveDurableCustomer(
  customer: Customer, 
  userId: string | null
): Promise<{ success: boolean; fromDb: boolean; error?: string }> {
  if (!userId) {
    // Save to global local storage
    const raw = localStorage.getItem(STORAGE_KEY);
    const list: Customer[] = raw ? JSON.parse(raw) : [];
    const index = list.findIndex(c => c.id === customer.id);
    if (index >= 0) {
      list[index] = customer;
    } else {
      list.unshift(customer);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return { success: true, fromDb: false };
  }

  // Save to user-specific localStorage cache first to avoid losing data
  const userKey = `${STORAGE_KEY}_${userId}`;
  const localRaw = localStorage.getItem(userKey);
  const localList: Customer[] = localRaw ? JSON.parse(localRaw) : [];
  const localIndex = localList.findIndex(c => c.id === customer.id);
  if (localIndex >= 0) {
    localList[localIndex] = customer;
  } else {
    localList.unshift(customer);
  }
  localStorage.setItem(userKey, JSON.stringify(localList));

  // Push to Supabase Cloud
  try {
    const payload = mapToDb(customer, userId);
    const { error } = await supabase
      .from('telecom_customers')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('Upsert error to ' + userId + ' : ', error.message);
      return { 
        success: true, 
        fromDb: false, 
        error: `Could not sync to cloud database (${error.message}). Saved locally.` 
      };
    }
    return { success: true, fromDb: true };
  } catch (e: any) {
    return { 
      success: true, 
      fromDb: false, 
      error: 'Cloud connectivity loss. Offline copy updated.' 
    };
  }
}

/**
 * Permanently purges a customer.
 */
export async function deleteDurableCustomer(
  id: string, 
  userId: string | null
): Promise<{ success: boolean; error?: string }> {
  if (!userId) {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const list: Customer[] = JSON.parse(raw);
      const filtered = list.filter(c => c.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    }
    return { success: true };
  }

  // Delete from user local cache
  const userKey = `${STORAGE_KEY}_${userId}`;
  const localRaw = localStorage.getItem(userKey);
  if (localRaw) {
    const localList: Customer[] = JSON.parse(localRaw);
    const filtered = localList.filter(c => c.id !== id);
    localStorage.setItem(userKey, JSON.stringify(filtered));
  }

  // Delete from Supabase
  try {
    const { error } = await supabase
      .from('telecom_customers')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
