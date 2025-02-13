import React, { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { useUser } from "../contexts/UserContext.js";
import { createCheckoutSession } from "../services/userService.js"; // Import service
import { fetchProducts } from "../services/adminService.js";

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
  }, [])

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
      (acc, item) => acc + (!user.madeFirstPurchase ? item.firstPurchaseDiscountPrice : item.price) * item.quantity,
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
        user.madeFirstPurchase,
      );
      const stripe = await stripePromise;
      await stripe.redirectToCheckout({ sessionId: session.id });
    } catch (error) {
      console.error("Error during checkout:", error.message);
      setErrorMessage("Checkout failed. Please try again.");
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Purchase Credits</h2>
      {!user.madeFirstPurchase && <h3>Enjoy 50% off on your first purchase!</h3>}
      {errorMessage && <p style={styles.error}>{errorMessage}</p>}

      <ul style={styles.optionList}>
        {products.map((option, index) => (
          <li key={index} style={styles.optionItem}>
          <strong>{option.name}</strong> 
          {!user.madeFirstPurchase ? (
            <>
              <s>${option.price.toFixed(2)}</s> ${(option.firstPurchaseDiscountPrice).toFixed(2)}
            </>
          ) : (
            `$${option.price.toFixed(2)}`
          )}
          <div style={styles.quantityContainer}>
            <button
              onClick={() =>
                updateCart(option, (cart[option._id]?.quantity || 0) - 1)
              }
              style={styles.quantityButton}
            >
              -
            </button>
            <span>{cart[option._id]?.quantity || 0}</span>
            <button
              onClick={() =>
                updateCart(option, (cart[option._id]?.quantity || 0) + 1)
              }
              style={styles.quantityButton}
            >
              +
            </button>
          </div>
        </li>
        ))}
      </ul>

      <h3>Credits: {calculateTotalCredits(cart)}</h3>
      <h3>
        Total: $
        {!user.madeFirstPurchase && totalPrice !== 0 ? (
          <>
            <s>{totalPrice}</s> {(totalDiscountPrice)}
          </>
        ) : (
          totalPrice
        )}
      </h3>

      <button onClick={handleCheckout} style={styles.purchaseButton}>
        Checkout
      </button>
    </div>
  );
};

export default CreditShop;

const styles = {
  container: {
    padding: "20px",
    maxWidth: "400px",
    margin: "0 auto",
    textAlign: "center",
    backgroundColor: "#635d5d",
    borderRadius: "8px",
    boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
  },
  header: {
    fontSize: "24px",
    marginBottom: "20px",
  },
  optionList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  optionItem: {
    marginBottom: "15px",
    backgroundColor: "#4f4b4b",
    padding: "10px",
    borderRadius: "5px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quantityContainer: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  quantityButton: {
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "5px",
    padding: "5px 10px",
    cursor: "pointer",
  },
  purchaseButton: {
    marginTop: "20px",
    padding: "10px 20px",
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  error: {
    color: "red",
    marginBottom: "10px",
  },
};
