# SeraPay Digital Platform v3.0

| Information         | Value                                                      |
| ------------------- | ---------------------------------------------------------- |
| 🌐 **Website**      | https://gaslur.com                                         |
| 📚 **Repository**   | https://github.com/ganang-saputra/serapay-digital-platform |
| 👨‍💻 **Developer** | Ganang Saputra                                             |

The latest **SeraPay Digital Platform v3.0** introduces significant improvements in performance, security, database architecture, and new digital services designed to enhance scalability, reliability, and user experience.

---

<table>
<tr>
<td><img src="https://raw.githubusercontent.com/kopixpass-code/serapay-digital-platform-by-ganang-saputra/main/dokumentasi/1.jpg" width="400"></td>
<td><img src="https://raw.githubusercontent.com/kopixpass-code/serapay-digital-platform-by-ganang-saputra/main/dokumentasi/2.jpg" width="400"></td>
</tr>
</table>

# What's New in Version 3.0

## Modern Database Infrastructure

* Fully migrated from JSON-based storage to MySQL.
* Optimized SQL queries for faster data access.
* Improved relational database architecture.
* Better transaction handling for high-volume operations.
* Reduced risk of data corruption associated with file-based storage.
* Improved scalability for future platform expansion.

---

# Problem, Solution & Results

## Problem

When developing **SeraPay**, several technical and operational challenges needed to be addressed:

* JSON-based data storage became increasingly difficult to maintain as the platform grew.
* Simultaneous transactions could lead to inconsistent data and reduced system reliability.
* Customer support required significant manual effort, increasing response times.
* User authentication lacked advanced security features such as email verification and OTP-based login.
* Administrators needed to constantly access the web dashboard to monitor transactions and manage daily operations.
* Real-time updates for payments, transactions, and customer activities were limited.
* Integrating multiple third-party services (Payment Gateway, Gmail API, Virtual Number API, Telegram Bot, and AI services) into a single platform required a scalable architecture.

---

## Solution

To overcome these challenges, I redesigned and modernized the platform by implementing:

* Migrated the entire data storage layer from JSON files to a relational MySQL database.
* Redesigned the backend architecture using Express.js and RESTful APIs.
* Implemented JWT Authentication, bcrypt password hashing, Email OTP Verification, and secure session management.
* Built a real-time communication system using Socket.IO for live transaction updates and notifications.
* Developed a Telegram Administration Bot to enable remote platform management without relying on the web dashboard.
* Integrated multiple third-party APIs, including Payment Gateway, Gmail API, Virtual Number API, and Telegram Bot API.
* Built an AI-powered customer support system using Ollama with the Qwen 2.5 3B model, allowing local AI deployment without external LLM APIs.
* Refactored critical services to improve maintainability, scalability, and long-term development.

---

## Results

The improvements delivered measurable technical and operational benefits:

* Faster and more reliable database operations after migrating to MySQL.
* Improved data consistency through relational database design and transaction handling.
* Stronger application security with JWT authentication, encrypted passwords, and Email OTP verification.
* Real-time synchronization of payments, orders, chat messages, and transaction statuses.
* Reduced administrator workload through Telegram-based remote management and operational automation.
* Lower AI operational costs by deploying a local Large Language Model using Ollama instead of relying entirely on paid external AI APIs.
* Better application maintainability thanks to backend refactoring and modular architecture.
* Increased platform scalability, making it easier to introduce new digital services and future feature expansions.
* Improved user experience with faster response times, automated workflows, and secure authentication.


## Security Improvements

* JWT Authentication for secure session management.
* Password hashing using bcrypt.
* API input validation across all endpoints.
* User-based access control and authorization.
* Protection against transaction manipulation.
* Automatic session invalidation after password changes.
* Authentication rate limiting.
* Login activity audit logs.
* Email verification before account activation.
* Multiple security vulnerabilities fixed from previous versions.

---

## New Authentication & Email OTP Verification

Version 3.0 introduces a redesigned authentication system focused on improving account security.

### New Features

* Redesigned Login page.
* Updated User Registration page.
* Updated Forgot Password flow.
* Email OTP Verification.
* Automatic OTP delivery via Nodemailer.
* OTP expiration mechanism.
* OTP verification attempt limitation.
* Automatic OTP regeneration.
* Email-based account activation.
* Encrypted verification tokens.

---

## Performance & Stability

* Backend refactoring for improved maintainability.
* Optimized real-time transaction processing.
* Migrated critical data from JSON to MySQL.
* Reduced dependency on file-based storage.
* Fixed numerous frontend and backend JavaScript issues.
* Improved stability under concurrent transactions.
* Integrated monitoring and service management system.

---

# Telegram Administration Bot

SeraPay includes a dedicated Telegram Bot that enables administrators to manage platform operations remotely without opening the web dashboard.

## Features

* Reply to customer live chat directly from Telegram.
* Approve or reject account submissions.
* Approve or reject withdrawal requests.
* Manual user balance adjustments.
* Real-time transaction notifications.
* User activity monitoring.
* Platform monitoring.

## Available Commands

* `/deposit` — Add user balance manually.
* `/restock` — Instantly restock digital products.
* `/stop` — Temporarily disable account submission services.
* `/on` — Re-enable account submission services.
* Additional management and monitoring commands.

This automation significantly improves operational efficiency and allows administrators to manage the platform from anywhere.

---

# Core Features

## User Management

* User Registration & Login
* JWT Authentication
* bcrypt Password Encryption
* Password Reset & Change
* User Profile Management
* Activity History
* Email OTP Login
* Email OTP Registration
* Forgot Password via Email OTP
* Automatic Email Delivery using Nodemailer
* Login Activity Monitoring

---

# Digital Account Marketplace

## Available Products

* Gmail Fresh Accounts
* Gmail Used Accounts
* Facebook Fresh Accounts
* Facebook Used Accounts
* Backup Email Accounts
* Custom Email Accounts

## Marketplace Features

* Automatic stock management.
* Real-time inventory monitoring.
* Instant account delivery after payment.
* Purchase history.
* Transaction status tracking.

---

# Account Submission System

Users can sell their digital accounts directly through the marketplace.

## Supported Accounts

* Facebook Accounts
* Gmail Accounts

## Features

* Account submission requests.
* Account verification.
* Submission status monitoring.
* Submission history.
* Withdrawal of earnings.

---

# Wallet & Withdrawal System

* Internal digital wallet.
* User transaction balance.
* Seller earnings balance.
* Balance history.
* Automated withdrawal processing.
* Bank account management.
* Daily transaction limitations.
* Withdrawal monitoring.

---

# OTP & Virtual Number Services

## Virtual Numbers

* Automatic virtual number purchase.
* Number status monitoring.
* Real-time OTP verification.
* Automated number management.

## Number Rental

New in Version 3.0:

* 20-minute rental.
* 24-hour rental.
* Real-time OTP monitoring.
* Automatic expiration management.

---

# Email Rental Service

## Gmail Rental

Users can rent Gmail accounts for OTP verification and email reception.

## Custom Email Domains

Supports multiple email domains for digital verification services.

## Features

* Real-time incoming email monitoring.
* Transaction synchronization.
* OTP & email history.
* Gmail API Integration.

---

# AI AutoResponder

One of the flagship features of Version 3.0.

## Features

* AI-powered AutoResponder.
* Multi-language support.
* Automated customer conversations.
* User license management.
* License expiration management.
* AI Customer Service.
* Live Chat integration.
* Context memory.
* Multi-session conversations.

## Latest AI Improvements

* Powered by Ollama.
* Uses Qwen 2.5 3B as the primary language model.
* Fully deployable on local infrastructure.
* No dependency on external AI APIs.
* Lower operational costs.
* Faster response times.
* Real-time integration with Admin Dashboard.
* 24/7 AI Customer Support.

---

# Payment System

## Payment Gateway

* iPaymu Payment Gateway Integration.
* QRIS Payments.
* Automatic payment verification.
* Real-time balance updates.
* Payment history.

---

# Refund Management

* Refund requests.
* Admin approval workflow.
* Refund rejection management.
* Automatic balance restoration.
* Refund history.

---

# Admin Dashboard

## System Monitoring

* User management.
* Transaction monitoring.
* Payment monitoring.
* Product inventory monitoring.
* Digital service management.
* Account submission verification.
* Refund approval.
* System activity monitoring.

## Data Management

* Digital product management.
* User balance management.
* AI license management.
* Virtual number management.
* Email rental management.

---

# Real-Time Communication

Powered by Socket.IO

* Instant transaction notifications.
* Real-time order status updates.
* Live payment monitoring.
* Automatic data synchronization.
* Live Admin Dashboard updates.

---

# Live Chat Support

* Real-time messaging.
* Conversation history.
* Customer activity monitoring.
* Instant notifications.
* AI AutoResponder powered by Ollama & Qwen 2.5 3B.

---

# Digital Notes System

* Personal notes.
* Centralized data storage.
* Public note sharing.
* Transaction and activity documentation.

---

# Technology Stack

## Backend

* Node.js
* Express.js
* Socket.IO
* MySQL
* JWT Authentication
* bcrypt
* Axios
* Nodemailer
* Ollama API

## Frontend

* HTML5
* CSS3
* JavaScript (ES6+)
* Responsive Web Design

## Database

* MySQL
* Relational Database Design
* Query Optimization

## API Integrations

* Gmail API
* Google OAuth 2.0
* Telegram Bot API
* iPaymu Payment Gateway
* OTP Provider API
* Virtual Number API
* AI API Integration
* Ollama API

---

# Technical Highlights

During the development of **SeraPay Digital Platform v3.0**, I designed and implemented:

* Full-Stack Web Application Development
* RESTful API Development
* Authentication & Authorization Systems
* Email OTP Verification
* SMTP Integration using Nodemailer
* Payment Gateway Integration
* Gmail API Integration
* Real-Time Communication with Socket.IO
* Marketplace Management System
* Relational Database Design with MySQL
* AI AutoResponder Integration
* Ollama Deployment
* Qwen 2.5 3B Integration
* Transaction Automation
* Infrastructure Migration (JSON → MySQL)
* Bug Fixing & Performance Optimization
* Security Hardening
* Responsive Web Development

---

# Developer

## Ganang Saputra

**SeraPay Digital Platform** was developed as a portfolio project demonstrating my expertise in building medium to large-scale full-stack web applications. The project showcases experience in backend and frontend development, relational database design, REST API development, third-party API integrations, real-time systems, authentication and security, digital transaction automation, and modern AI-powered applications using locally deployed Large Language Models (LLMs) with **Ollama** and **Qwen 2.5 3B**.

The platform emphasizes scalable software architecture, maintainable code, secure system design, and production-ready engineering practices suitable for modern digital service platforms.
