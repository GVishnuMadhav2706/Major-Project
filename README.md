<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# 📊 Telecom Customer Churn Prediction & Analytics System

A full-stack intelligent telecom analytics platform designed to predict customer churn, analyze subscriber behavior, and manage real-time customer data using cloud database integration and interactive dashboards.

This system simulates real-world telecom CRM analytics by combining predictive logic, data visualization, and cloud storage operations.

---

## 🌐 Live Links

- 🔗 **Live Application (Deployed on Vercel):**  
https://vercel.com/vishnu13/major-project  

- 🔗 **Backend Database (Supabase Project):**  
https://supabase.com/dashboard/project/znxegzinakvnnkugfsknand  

- ☁️ **Cloud Services Used:**  
:contentReference[oaicite:0]{index=0}  
:contentReference[oaicite:1]{index=1}  

---

## 🧠 Project Objective

The main objective of this system is to analyze telecom subscriber data and predict customer churn probability based on behavioral and usage patterns.

It helps telecom providers:
- Identify high-risk customers
- Improve retention strategies
- Monitor customer engagement
- Manage real-time subscriber databases

---

## ⚙️ System Overview

The application is a **dashboard-based analytics system** with the following capabilities:

- 📊 Real-time churn prediction engine
- 👤 Subscriber management system
- ☁️ Cloud-based database integration
- 📁 File upload and storage system
- 📈 Interactive analytics dashboard
- 🔍 Search, filter, and sort customer records

---

## 🧾 Key Functional Modules

### 1. Customer Registry System
- Stores subscriber profiles
- Displays 30+ customer records
- Allows filtering by name, plan, and risk level
- Supports real-time updates from cloud database

---

### 2. Churn Prediction Engine
The system classifies customers into:

- 🟢 **Low Risk (0–30%)** → Loyal customers
- 🟡 **Medium Risk (30–69%)** → At-risk customers
- 🔴 **High Risk (70–100%)** → Likely to churn

Prediction is based on:
- Tenure duration
- Monthly usage patterns
- Recharge/spend amount
- Support call frequency
- Contract type

---

### 3. Analytics Dashboard
- Total customers count
- Active vs churned users
- Risk distribution charts
- Churn percentage visualization (~47%)
- Real-time classification summary

---

### 4. Cloud Integration System
The system is fully integrated with cloud services:

- Customer data stored in Supabase database
- File uploads through Supabase storage buckets
- Real-time synchronization with dashboard UI
- Secure API-based communication

---

### 5. Object Storage System
Supports:
- JSON file uploads
- CSV / TXT dataset imports
- Bulk subscriber data ingestion
- Cloud bucket synchronization

Bucket used:
- `telecom-details`

---

## 🛠️ Tech Stack

- Frontend: React + Vite + TypeScript  
- Backend: Node.js (TSX server)  
- Database: :contentReference[oaicite:2]{index=2}  
- Hosting: :contentReference[oaicite:3]{index=3}  
- Storage: Supabase Storage Buckets  
- Styling: CSS + Component-based UI  

---

## 📂 Project Structure
