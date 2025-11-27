import Stripe from "stripe";

// Singleton pattern to ensure only one Stripe instance
let stripeInstance: Stripe | null = null;

const getStripe = (): Stripe => {
    if (!stripeInstance) {
        if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error("STRIPE_SECRET_KEY is not defined in environment variables");
        }
        
        stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: "2025-04-30.basil", // Use the latest API version
            typescript: true,
        });
    }
    
    return stripeInstance;
};

export default getStripe;
