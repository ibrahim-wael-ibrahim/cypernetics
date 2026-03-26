export function getAuthToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem('token');
}

export async function fetchApiCart() {
  const token = getAuthToken();

  if (!token) {
    return { id: null, items: [], itemCount: 0, subtotal: 0 };
  }

  const response = await fetch('/api/cart', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch cart');
  }

  const payload = await response.json();
  return payload.data;
}

export async function addApiCartItem(productId, quantity = 1) {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch('/api/cart', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ productId, quantity }),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || 'Failed to add item to cart');
  }

  return payload;
}

export async function updateApiCartItem(itemId, quantity) {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`/api/cart/items/${itemId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ quantity }),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || 'Failed to update cart item');
  }

  return payload;
}

export async function removeApiCartItem(itemId) {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`/api/cart/items/${itemId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || 'Failed to remove cart item');
  }

  return payload;
}

export async function clearApiCart() {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch('/api/cart', {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || 'Failed to clear cart');
  }

  return payload;
}

export async function syncLocalItemsToApi(localItems = []) {
  const failedItems = [];
  const apiCart = await fetchApiCart();
  const existingByProductId = new Map(
    (apiCart?.items || []).map((item) => [item.productId, item])
  );

  for (const item of localItems) {
    try {
      const existingItem = existingByProductId.get(item.productId);

      if (existingItem) {
        const maxStock =
          existingItem.product?.stockQuantity ?? existingItem.quantity + item.quantity;
        const desiredQuantity = existingItem.quantity + item.quantity;
        const targetQuantity = Math.min(desiredQuantity, maxStock);

        if (targetQuantity > existingItem.quantity) {
          await updateApiCartItem(existingItem.id, targetQuantity);
        }

        existingByProductId.set(item.productId, {
          ...existingItem,
          quantity: targetQuantity,
        });
        continue;
      }

      const localStock = item.product?.stockQuantity ?? item.quantity;
      if (localStock <= 0) {
        failedItems.push(item);
        continue;
      }

      const quantityToAdd = Math.min(item.quantity, localStock);
      await addApiCartItem(item.productId, quantityToAdd);
    } catch {
      failedItems.push(item);
    }
  }

  return failedItems;
}
