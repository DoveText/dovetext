import { CreateDeliveryMethodRequest, DeliveryMethod, UpdateDeliveryMethodRequest } from '@/types/delivery-method';

const API_BASE = '/api/v1/delivery-methods';

export async function getDeliveryMethods(): Promise<DeliveryMethod[]> {
  const response = await fetch(API_BASE, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch delivery methods');
  }

  return response.json();
}

export async function createDeliveryMethod(data: CreateDeliveryMethodRequest): Promise<DeliveryMethod> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to create delivery method');
  }

  return response.json();
}

export async function updateDeliveryMethod(id: string, data: UpdateDeliveryMethodRequest): Promise<DeliveryMethod> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update delivery method');
  }

  return response.json();
}

export async function deleteDeliveryMethod(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to delete delivery method');
  }
}

export async function verifyDeliveryMethod(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to verify delivery method');
  }
}

export async function setDefaultDeliveryMethod(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}/default`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to set default delivery method');
  }
}
