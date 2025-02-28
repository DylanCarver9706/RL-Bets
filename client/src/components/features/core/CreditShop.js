import React, { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { useUser } from "../../../contexts/UserContext";
import { createCheckoutSession } from "../../../services/userService"; // Import service
import { fetchProducts } from "../../../services/adminService";
import "../../../styles/components/core/CreditShop.css";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const CreditShop = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});
  const [totalPrice, setTotalPrice] = useState(0);
  const [totalDiscountPrice, setTotalDiscountPrice] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  const { user } = useUser();

  useEffect(() => {
    const getProducts = async () => {
      try {
        const products = await fetchProducts();
        setProducts(products);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    getProducts();
  }, []);

  // Update cart and recalculate total
  const updateCart = (option, quantity) => {
    const newCart = {
      ...cart,
      [option._id]: {
        ...option,
        quantity: Math.max(0, quantity), // Prevent negative quantities
      },
    };
    setCart(newCart);
    calculateTotalPrice(newCart);
  };

  // Calculate the total price based on the cart
  const calculateTotalPrice = (cart) => {
    const totalAmount = Object.values(cart).reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );
    const totalDiscountAmount = Object.values(cart).reduce(
      (acc, item) =>
        acc +
        (!user.madeFirstPurchase
          ? item.firstPurchaseDiscountPrice
          : item.price) *
          item.quantity,
      0
    );
    setTotalPrice(totalAmount.toFixed(2)); // Keep 2 decimal places
    setTotalDiscountPrice(totalDiscountAmount.toFixed(2)); // Keep 2 decimal places
  };

  // Calculate the total price based on the cart
  const calculateTotalCredits = (cart) => {
    const totalAmount = Object.values(cart).reduce(
      (acc, item) => acc + item.credits * item.quantity,
      0
    );
    return totalAmount; // Keep 2 decimal places
  };

  const handleCheckout = async () => {
    const purchaseItems = Object.values(cart).filter(
      (item) => item.quantity > 0
    );

    if (purchaseItems.length === 0) {
      setErrorMessage("Please add some credits to your cart.");
      return;
    }

    try {
      const session = await createCheckoutSession(
        purchaseItems,
        user.mongoUserId,
        user.madeFirstPurchase
      );
      const stripe = await stripePromise;
      await stripe.redirectToCheckout({ sessionId: session.id });
    } catch (error) {
      console.error("Error during checkout:", error.message);
      setErrorMessage("Checkout failed. Please try again.");
    }
  };

  return (
    <div className="credit-shop-container">
      <h2 className="credit-shop-header">Purchase Credits</h2>

      {!user.madeFirstPurchase && (
        <div className="first-purchase-banner">
          Enjoy 50% off on your first purchase!
        </div>
      )}

      {errorMessage && <p className="error-message">{errorMessage}</p>}

      <ul className="credit-options-list">
        {products.map((option) => (
          <li key={option._id} className="credit-option">
            <div className="option-details">
              <span className="option-name">{option.name}</span>
              <span className="option-price">
                {!user.madeFirstPurchase ? (
                  <>
                    <span className="original-price">
                      ${option.price.toFixed(2)}
                    </span>
                    <span className="discounted-price">
                      ${option.firstPurchaseDiscountPrice.toFixed(2)}
                    </span>
                  </>
                ) : (
                  `$${option.price.toFixed(2)}`
                )}
              </span>
            </div>

            <div className="quantity-controls">
              <button
                className="quantity-button"
                onClick={() =>
                  updateCart(option, (cart[option._id]?.quantity || 0) - 1)
                }
                disabled={!cart[option._id]?.quantity}
              >
                -
              </button>
              <span className="quantity-display">
                {cart[option._id]?.quantity || 0}
              </span>
              <button
                className="quantity-button"
                onClick={() =>
                  updateCart(option, (cart[option._id]?.quantity || 0) + 1)
                }
              >
                +
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="cart-summary">
        <div className="total-credits">
          Credits: {calculateTotalCredits(cart)}
        </div>
        <div className="total-price">
          Total:{" "}
          {!user.madeFirstPurchase && totalPrice !== "0.00" ? (
            <>
              <span className="original-price">${totalPrice}</span>
              <span className="discounted-price">${totalDiscountPrice}</span>
            </>
          ) : (
            `$${totalPrice}`
          )}
        </div>
        <button
          className="checkout-button"
          onClick={handleCheckout}
          disabled={!Object.keys(cart).length}
        >
          Checkout
        </button>
      </div>
    </div>
  );
};

export default CreditShop;
