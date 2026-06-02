import { api, type ApiEnvelope } from './api';

export type PlanCode = 'pro' | 'enterprise';

export type RazorpayOrderResponse = {
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
  plan_code: PlanCode;
};

export async function createRazorpayOrder(planCode: PlanCode) {
  const response = await api.post<ApiEnvelope<RazorpayOrderResponse>>('/subscriptions/create-order', {
    plan_code: planCode,
  });
  return response.data.data;
}

export type VerifyRazorpayPaymentPayload = {
  plan_code: PlanCode;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export async function verifyRazorpayPayment(payload: VerifyRazorpayPaymentPayload) {
  const response = await api.post<ApiEnvelope<{ upgraded: true; plan: PlanCode }>>('/subscriptions/verify', payload);
  return response.data.data;
}
export type SubscriptionPlanItem = {
  plan_code: string;
  name: string;
  price: number;
  max_users: number;
  max_warehouses: number;
  max_products: number;
  feature_barcode: boolean;
  feature_warehouses: boolean;
  feature_procurement: boolean;
  feature_analytics: boolean;
  feature_exports: boolean;
  feature_audit_logs: boolean;
  description: string;
};

export async function getPlans() {
  const response = await api.get<ApiEnvelope<SubscriptionPlanItem[]>>('/subscriptions/plans');
  return response.data.data;
}
