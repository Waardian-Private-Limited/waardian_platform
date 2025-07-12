import { apiClient } from './apiClient';

export async function validateToken(token: string) {
  try {
    const response = await apiClient(`/onboarding/validate/${token}`, {
      method: 'GET',
    });
    console.log('Token validation response:', response);
    return response;
  } catch (error) {
    console.error('Error validating token:', error);
    throw error;
  }
}

export async function validateUserOnboardingToken(token: string) {
  try {
    const response = await apiClient(`/useronboarding/validate/${token}`, {
      method: 'GET',
    });
    console.log('Token validation response:', response);
    return response;
  } catch (error) {
    console.error('Error validating token:', error);
    throw error;
  }
}

export async function getWings(societyId: string) {
  try {
    const response = await apiClient(`/onboarding/wings?societyId=${societyId}`, {
      method: 'GET',
    });
    console.log('Wings response:', response);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching wings:', error);
    throw error;
  }
}

export async function getFloors(societyId: string, wingId: string) {
  try {
    const response = await apiClient(`/onboarding/floors?societyId=${societyId}&wingId=${wingId}`, {
      method: 'GET',
    });
    console.log('Floors response:', response);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching floors:', error);
    throw error;
  }
}

export async function getFlats(societyId: string, wingId: string, floorId: string) {
  try {
    const response = await apiClient(`/onboarding/flats?societyId=${societyId}&wingId=${wingId}&floorId=${floorId}`, {
      method: 'GET',
    });
    console.log('Flats response:', response);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching flats:', error);
    throw error;
  }
}

export async function getSubscriptions() {
  try {
    const response = await apiClient('/onboarding/getSubscriptionPlans', {
      method: 'GET',
    });
    console.log('Subscriptions response:', response);
    return Array.isArray(response) ? response : response.plans || [];
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    throw error;
  }
}

export async function completeOnboarding(payload: any) {
  try {
    const response = await apiClient('/onboarding/complete', {
      method: 'POST',
      body: payload,
    });
    console.log('Onboarding completion response:', response);
    return response;
  } catch (error) {
    console.error('Error completing onboarding:', error);
    throw error;
  }
}

export async function completeUserOnboarding(payload: any) {
  try {
    const response = await apiClient('/useronboarding/complete', {
      method: 'POST',
      body: payload,
    });
    console.log('Onboarding completion response:', response);
    return response;
  } catch (error) {
    console.error('Error completing onboarding:', error);
    throw error;
  }
}