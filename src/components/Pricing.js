import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { useNavigate } from "react-router-dom";





function Pricing() {
  const [isMonthly, setIsMonthly] = useState(true);
  const navigate = useNavigate();

   useEffect(() => {
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    gtag('js', new Date());
    gtag('config', 'G-FR7630J1YJ');
  }, []);


  const togglePricing = () => {
    setIsMonthly(!isMonthly);
  };

  const redirectToSignup = () => {
    navigate(`/employer/login`);
   
  };


  return (
    <>
        <header>
        <title>Pricing and Packages | PostLn</title>
        <meta name="description" content="Checkout the prices and rates for Linkedin Professionals." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-FR7630J1YJ"></script>

      </header>

      <Navbar />

      <div className="container mb-5 plansHeaderMargin">
        <div className="text-center">
          <div className={`btn-group custom-btn-group ${isMonthly ? 'monthly' : 'yearly'}`} role="group">
            <button
              type="button"
              className={`btn ${isMonthly ? 'price-btn-color-1' : 'price-btn-color-2'} ${isMonthly ? 'active' : ''}`}
              onClick={togglePricing}
            >
              Monthly
            </button>
            <button
              type="button"
              className={`btn ${isMonthly ? 'price-btn-color-1' : 'price-btn-color-2'} ${isMonthly ? '' : 'active'}`}
              onClick={togglePricing}
            >
              Annually (Save 20%)
            </button>
          </div>
        </div>
      </div>

      <div className="container row mx-auto justify-content-center mb-5">


        <div className="col-12 col-md-4 col-lg-4 py-3">
          <div className="border border-primary rounded p-3">
            <div className="row text-center">
              <p><span className="pricing-txt"> Starter</span></p>
              <p><span className="pricing-txt-description"> To try out our platform and see if it fits your needs.</span></p>
              <p><span className="pricing-txt-price"> {isMonthly ? '₹2350' : '₹2970'}</span>(Incl. GST)</p>
              <p><span className="pricing-txt-caption">{isMonthly ? 'INR • Per month • Billed annually' : 'INR • Per month • Billed monthly'}</span></p>
              
            </div>
            <div className="features-details">

<div className="bb-txt-3 cussLine">
<span className="material-icons me-3">account_box</span>
  <p>Unlimited profiles</p>
</div>

<div className="bb-txt-3 cussLine">
<span className="material-icons me-3">list_alt</span>
  <p>Unlimited shortlists</p>
</div>


<div className="bb-txt-3 cussLine">
<span class="material-icons me-3">mark_email_read</span>
  <p>5 Shortlists per month</p>
</div>

<div className="bb-txt-3 cussLine">
<span class="material-icons me-3">chat_bubble</span>
  <p>2-way chat Messaging</p>
</div>


<div className="bb-txt-3 cussLine">
<span class="material-icons me-3">filter_list</span>
  <p>Advanced filters & search</p>
</div>

<div className="bb-txt-3 cussLine">
<span class="material-icons me-3">support_agent</span>
  <p>Email Support</p>
</div>


</div>
            <div className="container my-4 mx-auto d-flex justify-content-center">
              <button className="btn login-btn-grad btn-g-fonts text-white" onClick={redirectToSignup} >Get Started</button>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4 col-lg-4 py-3">
          <div className="border border-primary rounded p-3">
            <div className="row text-center">
              <p><span className="pricing-txt"> Growth</span></p>
              <p><span className="pricing-txt-description">Ideal for solo recruiters or small agencies exploring quality talent.</span></p>

              <p><span className="pricing-txt-price"> {isMonthly ? '₹11880' : '₹14850'}</span>(Incl. GST)</p>
              <p><span className="pricing-txt-caption"> {isMonthly ? 'INR • Per month • Billed annually' : 'INR • Per month • Billed monthly'}</span></p>
            
            </div>
            <div className="features-details">

            <div className="bb-txt-3 cussLine">
<span className="material-icons me-3">account_box</span>
  <p>Unlimited profiles</p>
</div>

<div className="bb-txt-3 cussLine">
<span className="material-icons me-3">list_alt</span>
  <p>Unlimited shortlists</p>
</div>


<div className="bb-txt-3 cussLine">
<span class="material-icons me-3">mark_email_read</span>
  <p>50 Shortlists per month</p>
</div>

<div className="bb-txt-3 cussLine">
<span class="material-icons me-3">chat_bubble</span>
  <p>2-way chat Messaging</p>
</div>


<div className="bb-txt-3 cussLine">
<span class="material-icons me-3">filter_list</span>
  <p>Advanced filters & search</p>
</div>

<div className="bb-txt-3 cussLine">
<span class="material-icons me-3">support_agent</span>
  <p>Priority Email Support</p>
</div>

</div>
            <div className="container my-4 mx-auto d-flex justify-content-center">
              <button className="btn signup-btn-grad btn-g-fonts text-white" onClick={redirectToSignup}>Get Started</button>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4 col-lg-4 py-3">
          <div className="border border-primary rounded p-3">
            <div className="row text-center">
              <p><span className="pricing-txt"> Pro Agency</span></p>
              <p><span className="pricing-txt-description">For recruitment teams or agencies with high-volume hiring needs.</span></p>

              <p><span className="pricing-txt-price"> {isMonthly ? '₹40600' : '₹49500'}</span>(Incl. GST)</p>
              <p><span className="pricing-txt-caption"> {isMonthly ? 'INR • Per month • Billed annually' : 'INR • Per month • Billed monthly'}</span></p>

            </div>
          
              <div className="features-details">

            <div className="bb-txt-3 cussLine">
<span className="material-icons me-3">account_box</span>
  <p>Unlimited profiles</p>
</div>

<div className="bb-txt-3 cussLine">
<span className="material-icons me-3">list_alt</span>
  <p>Unlimited shortlists</p>
</div>


<div className="bb-txt-3 cussLine">
<span class="material-icons me-3">mark_email_read</span>
  <p>200 Shortlists per month</p>
</div>

<div className="bb-txt-3 cussLine">
<span class="material-icons me-3">chat_bubble</span>
  <p>Advanced chat messaging</p>
</div>


<div className="bb-txt-3 cussLine">
<span class="material-icons me-3">filter_list</span>
  <p>Advanced filters & search</p>
</div>

<div className="bb-txt-3 cussLine">
<span class="material-icons me-3">support_agent</span>
  <p>Dedicated account manager</p>
</div>

<div className="bb-txt-3 cussLine">
<span class="material-icons me-3">batch_prediction</span>
  <p>Access to early beta features (e.g., AI match scoring)</p>
</div>



</div>

            <div className="container my-4 mx-auto d-flex justify-content-center">
              <button className="btn signup-btn-grad btn-g-fonts text-white" onClick={redirectToSignup}>Get Started</button>
            </div>
          </div>
        </div>



      </div>

      <Footer />
    </>
  );
}

export default Pricing;
