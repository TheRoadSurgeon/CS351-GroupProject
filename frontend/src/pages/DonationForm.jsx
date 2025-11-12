import { useState } from "react";

export default function DonationForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [dateOfDonation, setDateOfDonation] = useState("");
  const [location,  setLocation]  = useState("");
  const [itemsToDonate, setItemsToDonate] = useState("");
  const [amount,    setAmount]    = useState("");

  const [status, setStatus] = useState(null); 

  function handleCancel() {
    setFirstName("");
    setLastName("");
    setEmail("");
    setDateOfDonation("");
    setLocation("");
    setItemsToDonate("");
    setAmount("");
    setStatus(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const dollars =
      amount.trim() === "" ? null : parseFloat(amount);

    const payload = {
        first_name: firstName,
        last_name:  lastName,
        email,
        date: dateOfDonation,     // "YYYY-MM-DD"
        location,
        items: itemsToDonate,     // text area content
        amount: amount === "" ? null : parseFloat(amount)
    };

    try {
      const res = await fetch("http://localhost:5000/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Request failed");
      }
      setStatus("Thanks! Donation recorded.");
      handleCancel(); // clears fields
    } catch (err) {
      setStatus("Error: " + err.message);
    }
  }

  return (
    <div id="donation">
      <h1>Donation Form</h1>

      <form onSubmit={handleSubmit} className="donation-form">
        <div className="field">
          <label>First name</label>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label>Last name</label>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label>Email (optional)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            
          />
        </div>

        <div className="field">
          <label>Date</label>
          <input
            type="date"
            value={dateOfDonation}
            onChange={(e) => setDateOfDonation(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Location</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            
          />
        </div>

        <div className="field">
          <label>Items to donate</label>
          <textarea
            rows={4}
            value={itemsToDonate}
            onChange={(e) => setItemsToDonate(e.target.value)}
            
          />
        </div>

        <div className="field">
          <label>Amount</label>
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div className="actions">
          <button type="submit">Submit</button>
          <button type="button" onClick={handleCancel}>
            Cancel
          </button>
        </div>

        {status && <p className="status">{status}</p>}
      </form>
    </div>
  );
}
