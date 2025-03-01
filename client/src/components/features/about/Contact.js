import "../../../styles/components/about/Contact.css";

const Contact = () => {
  return (
    <div className="about-content-container">
      <div className="about-container">
        <h1 className="about-header">Contact</h1>
        <div className="contact-content">
          <p>
            For all inquiries, business or other, please email RL Bets at{" "}
            <a
              href={`mailto:${process.env.REACT_APP_BUSINESS_EMAIL}`}
              className="contact-email"
            >
              {process.env.REACT_APP_BUSINESS_EMAIL}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Contact;
