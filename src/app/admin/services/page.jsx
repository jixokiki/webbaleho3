"use client";
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import NavbarAdmin from "@/components/NavbarAdmin";

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [renters, setRenters] = useState([]);
  const [mergedData, setMergedData] = useState([]);

  // Fetch orders data
  useEffect(() => {
    const unsubOrders = onSnapshot(
      collection(db, "orders"),
      (snapshot) => {
        let ordersList = [];
        snapshot.docs.forEach((doc) => {
          ordersList.push({ id: doc.id, ...doc.data() });
        });
        setOrders(ordersList);
      },
      (error) => {
        console.log(error);
      }
    );

    const unsubRenters = onSnapshot(
      collection(db, "renters"),
      (snapshot) => {
        let rentersList = [];
        snapshot.docs.forEach((doc) => {
          rentersList.push({ id: doc.id, ...doc.data() });
        });
        setRenters(rentersList);
      },
      (error) => {
        console.log(error);
      }
    );

    return () => {
      unsubOrders();
      unsubRenters();
    };
  }, []);

  // Compare and merge orders and renters data based on matching rentalDate and rentalStart
  useEffect(() => {
    const combinedData = [];

    orders.forEach((order) => {
      renters.forEach((renter) => {
        const rentalStartDate = renter.rentalStart.split("T")[0]; // Extracting date from renter's rentalStart
        if (order.rentalDate === rentalStartDate) {
          combinedData.push({
            ...order,
            renterFirstName: renter.firstName,
            renterLastName: renter.lastName,
            renterEmail: renter.email,
            renterPhone: renter.phone,
            renterSocialMedia: renter.socialMedia,
            renterComments: renter.comments,
            rentalStart: renter.rentalStart,
            rentalEnd: renter.rentalEnd,
          });
        }
      });
    });

    setMergedData(combinedData);
  }, [orders, renters]);

  return (
    <div className="w-[87%] mx-auto mt-32">
      <NavbarAdmin />
      <div className="flex flex-wrap gap-6 mb-10">
        <h1 className="text-3xl font-semibold mb-3">Orders & Renters Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Loop through the merged data */}
        {mergedData.map((data, index) => (
          <div key={index} className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Order ID: {data.id}</h2>
              <p><strong>Company Name:</strong> {data.companyName}</p>
              <p><strong>Email:</strong> {data.companyEmail}</p>
              <p><strong>Phone:</strong> {data.companyPhone}</p>
              <p><strong>Address:</strong> {data.companyAddress}</p>
              <p><strong>Bank Account:</strong> {data.bankAccount}</p>
              <p><strong>Location:</strong> {data.location}</p>
              <p><strong>Product Name:</strong> {data.productName}</p>
              <p><strong>Rental Date (Order):</strong> {data.rentalDate}</p>
              <p><strong>Rental Duration:</strong> {data.rentalDuration}</p>
              <p><strong>Package:</strong> {data.package}</p>
              <hr />
              <h3 className="text-lg font-semibold">Renter Information</h3>
              <p><strong>Renter Name:</strong> {data.renterFirstName} {data.renterLastName}</p>
              <p><strong>Renter Email:</strong> {data.renterEmail}</p>
              <p><strong>Renter Phone:</strong> {data.renterPhone}</p>
              <p><strong>Social Media:</strong> {data.renterSocialMedia}</p>
              <p><strong>Rental Start:</strong> {data.rentalStart}</p>
              <p><strong>Rental End:</strong> {data.rentalEnd}</p>
              <p><strong>Comments:</strong> {data.renterComments}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
