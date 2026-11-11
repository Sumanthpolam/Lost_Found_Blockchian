
import { useState } from "react";
import { ethers } from "ethers";
import {
  CONTRACT_ADDRESS,
  CONTRACT_ABI
} from "./blockchain/config";
import "./App.css";

function App() {
  const [account, setAccount] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    location: "",
    imageURL: "",
    status: "Lost"
  });

  async function getContract(write = false) {
    if (!window.ethereum) {
      throw new Error("Please install MetaMask");
    }

    const provider = new ethers.BrowserProvider(
      window.ethereum
    );

    const network = await provider.getNetwork();

    if (network.chainId !== 31337n) {
      throw new Error("Please select Hardhat Local network");
    }

    const signer = write
      ? await provider.getSigner()
      : undefined;

    return new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      signer || provider
    );
  }

  async function connectWallet() {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask");
        return;
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts"
      });

      setAccount(accounts[0]);
      setMessage("Wallet connected successfully!");

      await loadItems();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function loadItems() {
    try {
      const contract = await getContract();
      const count = Number(await contract.itemCount());

      const data = [];

      for (let i = count; i >= 1; i--) {
        const item = await contract.getItem(i);

        data.push({
          id: Number(item.id),
          name: item.name,
          description: item.description,
          location: item.location,
          imageURL: item.imageURL,
          status: item.status,
          reporter: item.reporter,
          claimant: item.claimant
        });
      }

      setItems(data);
    } catch (error) {
      console.error(error);
      setMessage("Unable to load items: " + error.message);
    }
  }

  async function reportItem(e) {
    e.preventDefault();

    try {
      if (!account) {
        await connectWallet();
        return;
      }

      setLoading(true);
      setMessage("Please confirm the transaction in MetaMask...");

      const contract = await getContract(true);

      const tx = await contract.reportItem(
        form.name,
        form.description,
        form.location,
        form.imageURL,
        form.status
      );

      await tx.wait();

      setMessage("Item reported successfully on blockchain!");

      setForm({
        name: "",
        description: "",
        location: "",
        imageURL: "",
        status: "Lost"
      });

      await loadItems();

    } catch (error) {
      setMessage(error.reason || error.message);
    } finally {
      setLoading(false);
    }
  }

  async function claimItem(id) {
    try {
      setLoading(true);
      setMessage("Confirm the claim transaction in MetaMask...");

      const contract = await getContract(true);

      const tx = await contract.claimItem(id);

      await tx.wait();

      setMessage("Item claimed successfully!");

      await loadItems();

    } catch (error) {
      setMessage(error.reason || error.message);
    } finally {
      setLoading(false);
    }
  }

  const myItems = items.filter(
    item =>
      item.reporter.toLowerCase() === account.toLowerCase()
  );

  return (
    <div className="app">

      <nav className="navbar">
        <h2>Lost<span>Found</span></h2>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#report">Report Item</a>
          <a href="#items">Browse Items</a>
          <a href="#myreports">My Reports</a>
        </div>

        <button onClick={connectWallet}>
          {account
            ? account.slice(0, 6) + "..." + account.slice(-4)
            : "Connect Wallet"}
        </button>
      </nav>

      <section className="hero" id="home">
        <div className="hero-content">
          <p className="tag">BLOCKCHAIN POWERED PLATFORM</p>

          <h1>
            Lost Something?
            <br />
            <span>Let's Find It Together.</span>
          </h1>

          <p className="description">
            Report lost belongings, discover found items
            and help people recover their belongings
            using blockchain technology.
          </p>

          <div className="hero-buttons">
            <a href="#items" className="primary-btn">
              Browse Items
            </a>

            <a href="#report" className="secondary-btn">
              Report an Item
            </a>
          </div>

          <p className="wallet-status">
            {account
              ? "Wallet connected: " + account.slice(0, 10) + "..."
              : "Connect your wallet to get started"}
          </p>
        </div>
      </section>

      {message && (
        <div className="message">
          {message}
        </div>
      )}

      <section className="stats">
        <div>
          <h2>{items.length}</h2>
          <p>Total Reports</p>
        </div>

        <div>
          <h2>{items.filter(i => i.status === "Lost").length}</h2>
          <p>Lost Items</p>
        </div>

        <div>
          <h2>{items.filter(i => i.status === "Found").length}</h2>
          <p>Found Items</p>
        </div>

        <div>
          <h2>{items.filter(i => i.status === "Claimed").length}</h2>
          <p>Claimed Items</p>
        </div>
      </section>

      <section className="report-section" id="report">
        <h2>Report an Item</h2>
        <p>Submit your lost or found item to the blockchain.</p>

        <form className="report-form" onSubmit={reportItem}>

          <input
            type="text"
            placeholder="Item Name"
            value={form.name}
            onChange={e =>
              setForm({ ...form, name: e.target.value })
            }
            required
          />

          <textarea
            placeholder="Item Description"
            value={form.description}
            onChange={e =>
              setForm({ ...form, description: e.target.value })
            }
            required
          />

          <input
            type="text"
            placeholder="Location"
            value={form.location}
            onChange={e =>
              setForm({ ...form, location: e.target.value })
            }
            required
          />

          <input
            type="url"
            placeholder="Image URL (optional)"
            value={form.imageURL}
            onChange={e =>
              setForm({ ...form, imageURL: e.target.value })
            }
          />

          <select
            value={form.status}
            onChange={e =>
              setForm({ ...form, status: e.target.value })
            }
          >
            <option value="Lost">Lost Item</option>
            <option value="Found">Found Item</option>
          </select>

          <button type="submit" disabled={loading}>
            {loading ? "Processing..." : "Submit to Blockchain"}
          </button>

        </form>
      </section>

      <section className="items-section" id="items">
        <h2>Reported Items</h2>
        <p>Explore lost and found belongings.</p>

        <button onClick={loadItems} disabled={loading}>
          Refresh Items
        </button>

        <div className="item-grid">
          {items.map(item => (
            <div className="item-card" key={item.id}>

              {item.imageURL && (
                <img
                  src={item.imageURL}
                  alt={item.name}
                  onError={e => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}

              <h3>{item.name}</h3>

              <p>{item.description}</p>

              <p><strong>Location:</strong> {item.location}</p>

              <p>
                <strong>Reporter:</strong>{" "}
                {item.reporter.slice(0, 8)}...
              </p>

              <span className={`status ${item.status.toLowerCase()}`}>
                {item.status}
              </span>

              {item.status === "Found" &&
                account &&
                item.reporter.toLowerCase() !== account.toLowerCase() && (
                  <button
                    onClick={() => claimItem(item.id)}
                    disabled={loading}
                  >
                    Claim Item
                  </button>
                )}

            </div>
          ))}

          {items.length === 0 && (
            <p>No items found. Report an item to get started.</p>
          )}
        </div>
      </section>

      <section className="my-reports" id="myreports">
        <h2>My Reports</h2>
        <p>Items reported by your connected wallet: {myItems.length}</p>

        {myItems.map(item => (
          <div className="my-report-row" key={item.id}>
            <strong>{item.name}</strong>
            <span>{item.status}</span>
          </div>
        ))}
      </section>

      <footer>
        <p>© 2026 LostFound | Blockchain Project</p>
        <p>Built with React, Solidity and Ethereum</p>
      </footer>

    </div>
  );
}

export default App;
