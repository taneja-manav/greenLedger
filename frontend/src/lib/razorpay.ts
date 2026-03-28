// Mocked Razorpay implementation for local development
export const razorpay = {
  orders: {
    create: async (options: any) => {
      console.log('Dummy Razorpay Order Created:', options);
      return {
        id: `mock_order_${Math.random().toString(36).substring(7)}`,
        amount: options.amount,
        currency: options.currency,
        notes: options.notes,
      };
    },
  },
};
