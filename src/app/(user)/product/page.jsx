"use client";
import useAuth from "@/app/hooks/useAuth";
import useProduct from "@/app/hooks/useProduct";
import CardItem from "@/components/CardItem";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { db } from "@/firebase/firebase";
import { collection, addDoc, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const Product = () => {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [data, setData] = useState([]);
  const [newAssetNotification, setNewAssetNotification] = useState(false);
  const [AssetNotification, setAssetNotification] = useState(false);
  const [formVisible, setFormVisible] = useState(false); // Control order form visibility
  const [renterFormVisible, setRenterFormVisible] = useState(false); // Control renter form visibility
  const [selectedProduct, setSelectedProduct] = useState(null); // Store selected product
  const [orderId, setOrderId] = useState(null); // Store order ID for renter form submission

  // State for the first form (order form)
  const [orderFormData, setOrderFormData] = useState({
    location: "",
    rentalDate: "",
    rentalDuration: "",
    package: "",
    companyName: "",
    companyEmail: "",
    companyPhone: "",
    companyAddress: "",
    bankAccount: "",
  });

  // State for the second form (renter identification form)
  const [renterFormData, setRenterFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    socialMedia: "",
    rentalStart: "",
    rentalEnd: "",
    comments: "",
  });

  const { isInCart, removeFromCart, addToCart } = useProduct();

  useEffect(() => {
    if (user && userProfile.role === "admin") {
      router.push("/admin");
    }
  }, [user, userProfile, router]);

  // Fetch products from Firestore and check for new asset notifications
  useEffect(() => {
    const unsubProduct = onSnapshot(
      collection(db, "products"),
      (snapshot) => {
        let list = [];
        snapshot.docs.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });

        const isNewAssetAdded = list.length === data.length;
        if (isNewAssetAdded) {
          setNewAssetNotification(true);
          setAssetNotification(false);
        } else {
          setNewAssetNotification(false);
          setAssetNotification(true);
        }

        setData(list);
      },
      (error) => {
        console.log(error);
      }
    );
    return () => {
      unsubProduct();
    };
  }, [data]);

  // Filter products based on selected category
  const filteredData =
    data && categoryFilter === "all"
      ? data
      : data.filter(
          (product) => product.category.toLowerCase() === categoryFilter
        );

  // Handle search input change
  const handleSearchInputChange = (e) => {
    setSearchInput(e.target.value.toLowerCase());
  };

  // Update filter based on search input
  useEffect(() => {
    const selectElement = document.querySelector(".select");
    selectElement.childNodes.forEach((option) => {
      if (option.value.toLowerCase().includes(searchInput)) {
        option.selected = true;
      }
    });
    setCategoryFilter(searchInput);
  }, [searchInput]);

  // Add to cart and display form
  const handleAddToCart = (product) => {
    addToCart(product);
    setSelectedProduct(product); // Store selected product
    setFormVisible(true); // Show form after adding product to cart
  };

  // Handle order form input change
  const handleOrderInputChange = (e) => {
    const { name, value } = e.target;
    setOrderFormData({
      ...orderFormData,
      [name]: value,
    });
  };

  // Handle renter form input change
  const handleRenterInputChange = (e) => {
    const { name, value } = e.target;
    setRenterFormData({
      ...renterFormData,
      [name]: value,
    });
  };

  // Submit order form data to Firebase
  const handleOrderFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const docRef = await addDoc(collection(db, "orders"), {
        ...orderFormData,
        productId: selectedProduct.id,
        productName: selectedProduct.title,
      });
      alert("Order placed successfully");
      setOrderId(docRef.id); // Store the order ID
      setFormVisible(false); // Hide order form after submission
      setRenterFormVisible(true); // Show renter form after order submission
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  // Submit renter form data to Firebase
  const handleRenterFormSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "renters"), {
        ...renterFormData,
        orderId: orderId, // Link renter form to the corresponding order
      });
      alert("Renter information submitted successfully");
      setRenterFormVisible(false); // Hide renter form after submission
    } catch (error) {
      console.error("Error adding renter information: ", error);
    }
  };

  // Hide form notification after a few seconds
  useEffect(() => {
    const notificationTimeout = setTimeout(() => {
      setNewAssetNotification(false);
    }, 5000);
    return () => clearTimeout(notificationTimeout);
  }, [newAssetNotification]);

  useEffect(() => {
    const notificationTimeout = setTimeout(() => {
      setAssetNotification(false);
    }, 5000);
    return () => clearTimeout(notificationTimeout);
  }, [AssetNotification]);

  return (
    <div>
      <Navbar />
      <div className="p-8 md:p-24 mt-10">
        <div className="flex justify-between mb-10">
          <h2 className="text-3xl mb-3">All Products</h2>
          {AssetNotification && (
            <div className="notification-3xl mb-3">Happy Hunting</div>
          )}
          <input
            type="text"
            className="input input-bordered"
            value={searchInput}
            onChange={handleSearchInputChange}
          />
          <select
            className="select select-bordered w-full max-w-xs"
            onChange={(e) => setCategoryFilter(e.target.value.toLowerCase())}
          >
            <option value={"all"}>All</option>
            <option value={"fikom"}>Fikom</option>
            <option value={"dkv"}>DKV</option>
            <option value={"fasilkom"}>Fasilkom</option>
            {/* Add other options here */}
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 place-items-center gap-6">
          {filteredData.map((product) => (
            <CardItem
              key={product.id}
              imageUrl={product.image}
              fakultas={product.category}
              judul={product.title}
              deskripsi={product.description}
              harga={product.price}
              addToCart={() => handleAddToCart(product)}
              removeFromCart={() => removeFromCart(product)}
              isInCart={isInCart(product.id)}
            />
          ))}
        </div>

        {/* Form for rental info (Order form) */}
        {formVisible && (
          <div className="fixed bottom-0 left-0 w-full bg-white p-4 shadow-lg max-h-[60vh] overflow-y-auto">
            <h2 className="text-lg mb-2">Complete Your Order</h2>
            <form onSubmit={handleOrderFormSubmit}>
              <div className="mb-2">
                <label htmlFor="location" className="block text-gray-700 text-sm">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  className="input input-bordered w-full py-1"
                  value={orderFormData.location}
                  onChange={handleOrderInputChange}
                  required
                />
              </div>
              <div className="mb-2">
                <label htmlFor="rentalDate" className="block text-gray-700 text-sm">
                  Rental Date
                </label>
                <input
                  type="date"
                  id="rentalDate"
                  name="rentalDate"
                  className="input input-bordered w-full py-1"
                  value={orderFormData.rentalDate}
                  onChange={handleOrderInputChange}
                  required
                />
              </div>
              <div className="mb-2">
                <label htmlFor="rentalDuration" className="block text-gray-700 text-sm">
                  Rental Duration
                </label>
                <input
                  type="text"
                  id="rentalDuration"
                  name="rentalDuration"
                  className="input input-bordered w-full py-1"
                  value={orderFormData.rentalDuration}
                  onChange={handleOrderInputChange}
                  required
                />
              </div>
              <div className="mb-2">
                <label htmlFor="package" className="block text-gray-700 text-sm">
                  Package
                </label>
                <select
                  id="package"
                  name="package"
                  className="input input-bordered w-full py-1"
                  value={orderFormData.package}
                  onChange={handleOrderInputChange}
                  required
                >
                  <option value="">Select a package</option>
                  <option value="fullPackage">Full Package</option>
                  <option value="basicPackage">Basic Package</option>
                </select>
              </div>
              {/* Additional fields for company details */}
              <div className="mb-2">
                <label htmlFor="companyName" className="block text-gray-700 text-sm">
                  Company Name
                </label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  className="input input-bordered w-full py-1"
                  value={orderFormData.companyName}
                  onChange={handleOrderInputChange}
                  required
                />
              </div>
              <div className="mb-2">
                <label htmlFor="companyEmail" className="block text-gray-700 text-sm">
                  Company Email
                </label>
                <input
                  type="email"
                  id="companyEmail"
                  name="companyEmail"
                  className="input input-bordered w-full py-1"
                  value={orderFormData.companyEmail}
                  onChange={handleOrderInputChange}
                  required
                />
              </div>
              <div className="mb-2">
                <label htmlFor="companyPhone" className="block text-gray-700 text-sm">
                  Company Phone
                </label>
                <input
                  type="text"
                  id="companyPhone"
                  name="companyPhone"
                  className="input input-bordered w-full py-1"
                  value={orderFormData.companyPhone}
                  onChange={handleOrderInputChange}
                  required
                />
              </div>
              <div className="mb-2">
                <label htmlFor="companyAddress" className="block text-gray-700 text-sm">
                  Company Address
                </label>
                <input
                  type="text"
                  id="companyAddress"
                  name="companyAddress"
                  className="input input-bordered w-full py-1"
                  value={orderFormData.companyAddress}
                  onChange={handleOrderInputChange}
                  required
                />
              </div>
              <div className="mb-2">
                <label htmlFor="bankAccount" className="block text-gray-700 text-sm">
                  Bank Account Number
                </label>
                <input
                  type="text"
                  id="bankAccount"
                  name="bankAccount"
                  className="input input-bordered w-full py-1"
                  value={orderFormData.bankAccount}
                  onChange={handleOrderInputChange}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary w-full py-2 text-sm">
                Submit Order
              </button>
            </form>
          </div>
        )}

        {/* Renter identification form */}
        {renterFormVisible && (
          <div className="fixed bottom-0 left-0 w-full bg-white p-4 shadow-lg max-h-[60vh] overflow-y-auto">
            <h2 className="text-lg mb-2">Renter Identification</h2>
            <form onSubmit={handleRenterFormSubmit}>
              <div className="mb-2">
                <label htmlFor="firstName" className="block text-gray-700 text-sm">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  className="input input-bordered w-full py-1"
                  value={renterFormData.firstName}
                  onChange={handleRenterInputChange}
                  required
                />
              </div>
              <div className="mb-2">
                <label htmlFor="lastName" className="block text-gray-700 text-sm">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  className="input input-bordered w-full py-1"
                  value={renterFormData.lastName}
                  onChange={handleRenterInputChange}
                  required
                />
              </div>
              <div className="mb-2">
                <label htmlFor="email" className="block text-gray-700 text-sm">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="input input-bordered w-full py-1"
                  value={renterFormData.email}
                  onChange={handleRenterInputChange}
                  required
                />
              </div>
              <div className="mb-2">
                <label htmlFor="phone" className="block text-gray-700 text-sm">
                  Phone
                </label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  className="input input-bordered w-full py-1"
                  value={renterFormData.phone}
                  onChange={handleRenterInputChange}
                  required
                />
              </div>
              <div className="mb-2">
                <label htmlFor="socialMedia" className="block text-gray-700 text-sm">
                  Social Media (Facebook/Twitter)
                </label>
                <input
                  type="text"
                  id="socialMedia"
                  name="socialMedia"
                  className="input input-bordered w-full py-1"
                  value={renterFormData.socialMedia}
                  onChange={handleRenterInputChange}
                  required
                />
              </div>
              <div className="mb-2">
                <label htmlFor="rentalStart" className="block text-gray-700 text-sm">
                  Rental Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  id="rentalStart"
                  name="rentalStart"
                  className="input input-bordered w-full py-1"
                  value={renterFormData.rentalStart}
                  onChange={handleRenterInputChange}
                  required
                />
              </div>
              <div className="mb-2">
                <label htmlFor="rentalEnd" className="block text-gray-700 text-sm">
                  Rental End Date & Time
                </label>
                <input
                  type="datetime-local"
                  id="rentalEnd"
                  name="rentalEnd"
                  className="input input-bordered w-full py-1"
                  value={renterFormData.rentalEnd}
                  onChange={handleRenterInputChange}
                  required
                />
              </div>
              <div className="mb-2">
                <label htmlFor="comments" className="block text-gray-700 text-sm">
                  Additional Comments
                </label>
                <textarea
                  id="comments"
                  name="comments"
                  className="input input-bordered w-full py-1"
                  value={renterFormData.comments}
                  onChange={handleRenterInputChange}
                  rows="3"
                />
              </div>
              <button type="submit" className="btn btn-primary w-full py-2 text-sm">
                Submit Renter Info
              </button>
            </form>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Product;
