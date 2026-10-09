import { api } from "./axios";
import type {
  ChangeSubscriptionPlanRequest,
  ChangeSubscriptionPlanResponse,
  CreateSubscriptionRequest,
  SubscriptionPixQrCode,
  SubscriptionPlans,
  SubscriptionState,
  UpdateSubscriptionCardRequest,
} from "@/lib/types/subscription.types";

export const subscriptionApi = {
  getPlans: async (): Promise<SubscriptionPlans> => {
    const res = await api.get<SubscriptionPlans>("/subscription/plans");
    return res.data;
  },

  get: async (): Promise<SubscriptionState> => {
    const res = await api.get<SubscriptionState>("/subscription");
    return res.data;
  },

  /** Card data goes straight to our API and on to Asaas — never stored in the browser. */
  create: async (data: CreateSubscriptionRequest): Promise<SubscriptionState> => {
    const res = await api.post<SubscriptionState>("/subscription", data);
    return res.data;
  },

  cancel: async (): Promise<SubscriptionState> => {
    const res = await api.post<SubscriptionState>("/subscription/cancel");
    return res.data;
  },

  resume: async (): Promise<SubscriptionState> => {
    const res = await api.post<SubscriptionState>("/subscription/resume");
    return res.data;
  },

  refund: async (): Promise<SubscriptionState> => {
    const res = await api.post<SubscriptionState>("/subscription/refund");
    return res.data;
  },

  changePlan: async (data: ChangeSubscriptionPlanRequest): Promise<ChangeSubscriptionPlanResponse> => {
    const res = await api.post<ChangeSubscriptionPlanResponse>("/subscription/change-plan", data);
    return res.data;
  },

  updateCard: async (data: UpdateSubscriptionCardRequest): Promise<SubscriptionState> => {
    const res = await api.put<SubscriptionState>("/subscription/card", data);
    return res.data;
  },

  getPendingPix: async (): Promise<SubscriptionPixQrCode> => {
    const res = await api.get<SubscriptionPixQrCode>("/subscription/pending-charge/pix");
    return res.data;
  },
};
