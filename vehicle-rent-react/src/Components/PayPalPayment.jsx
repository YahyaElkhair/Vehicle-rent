// PayPalPayment.jsx
import React, { useState , useContext} from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { AppContext } from '../context/AppContext';

const sandBoxClientId = import.meta.env.VITE_PAYPAL_SANDBOX_CLIENT_ID;

export default function PayPalPayment({ totalPayment, reservation, onPaymentSuccess }) {
    const [isCreatingPayment, setIsCreatingPayment] = useState(false);
    const { token } = useContext(AppContext);

    const createPaymentRecord = async (details) => {
        setIsCreatingPayment(true);

        try {
            const paymentData = {
                reservation_id: reservation.id,
                payment_method: "paypal",
                amount: totalPayment,
                currency: details.purchase_units[0].payments.captures[0].amount.currency_code,
                status: "COMPLETED",
                transaction_id: details.id,
                details: {
                    payer_email: details.payer.email_address,
                    country_code: details.payer.address.country_code,
                    capture_id: details.purchase_units[0].payments.captures[0].id,
                    payer_id: details.payer.payer_id,
                    payment_source: details.payment_source
                }
            };

            const response = await fetch('/api/payments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(paymentData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Payment record creation failed');
            }

            const data = await response.json();
            onPaymentSuccess(data.data);

        } catch (err) {
            console.error('Payment failed:', err);
            alert(`Payment failed: ${err.message}`);
        } finally {
            setIsCreatingPayment(false);
        }
    };

    return (
        <div className="p-4 max-w-md mx-auto">
            <h2 className="text-lg text-center font-bold mb-4">
                Pay ${totalPayment} with PayPal
            </h2>

            {isCreatingPayment && (
                <div className="text-center mb-4">
                    <p>Processing payment...</p>
                </div>
            )}

            <PayPalScriptProvider options={{ "client-id": sandBoxClientId }}>
                <PayPalButtons
                    style={{ layout: "vertical", shape: "pill", color: "gold" }}
                    createOrder={(_, actions) => actions.order.create({
                        purchase_units: [{ amount: { value: totalPayment } }]
                    })}
                    onApprove={(_, actions) => actions.order.capture()
                        .then(details => createPaymentRecord(details))
                    }
                    onCancel={() => alert("Payment cancelled.")}
                    onError={(err) => {
                        console.error("PayPal error:", err);
                        alert("Payment processing error");
                    }}
                    disabled={isCreatingPayment}
                />
            </PayPalScriptProvider>
        </div>
    );
}