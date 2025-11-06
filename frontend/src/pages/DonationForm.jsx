import { useState} from 'react';

export default function DonationForm(){
    
    // Make a variable amount and function setAmount()
    // setAmount() function is a setter and sets the amount.
    // DO NOT USE amount = 10
    // useState here starts with an empty string
    // We do this because we will handle everything as a string.
    // We then convert it to a number when we really need it as one.
    const [amount, setAmount] = useState("");


    function handleAmountChange(e){
        const newAmount = e.target.value;
        setAmount(newAmount);
    }

    return(
        <div style={{padding: 16}}>
            <h1>Dontation Form</h1>
            <p>Work in progress</p>
            <div>
                <input value = {amount} onChange= {handleAmountChange}placeholder="e.g. 25.00"></input>
                Current amount: {amount}
            </div>
        </div>
    )




}