# ScaleSync / SaleSync

An IoT-enabled full-stack business monitoring application built for managing product pricing, stock levels, sales, analytics, and notifications for a retail or oil-distribution workflow. It combines a React Native mobile client, a Node.js/Express backend, and a PostgreSQL database to provide a practical inventory and sales management system.

The IoT idea in this project is centered around smart weighing and automated sales monitoring. In a real-world setup, a weighing device or sensor would capture the quantity/weight of a product, send that data to the backend, and the system would calculate revenue, update stock, and trigger alerts.

This README is written in an interview-preparation style so you can understand not only what the project does, but also why each technology and design choice was used.

---

## 1. Project Overview

### What problem does this project solve?
This project helps a business owner track:
- product prices
- available stock
- sales made over time
- daily/period-based revenue
- mismatch situations where sales exceed expected stock
- notifications for important events

In simple terms, it is a lightweight ERP-style tool for a sales and inventory workflow.

### Core business flow
1. The owner or staff logs in.
2. Products and their prices are managed.
3. Stock is updated for each product.
4. Sales are recorded with their quantity/weight and calculated revenue.
5. The dashboard shows analytics, summary cards, stock status, and reports.
6. If stock is inconsistent or low, the system flags it.

### IoT part involved (very important for interviews)
This project is based on the concept of smart weighing and automated sales tracking.

- The main IoT-like data in the system is the weight/quantity of the product sold.
- In a real hardware implementation, a weighing sensor or smart weighing machine would measure the quantity.
- That sensor data would go to a microcontroller or gateway device, which would send it to the backend.
- The backend receives the weight, calculates the total amount, updates stock, and stores the transaction in the database.
- The mobile application then displays the sales summary, stock levels, and alerts.
- In this repository, the software side of that flow is implemented through the sales API and stock update logic. The actual physical sensor integration is not fully wired here, but the architecture is clearly designed for it.

This makes the project a strong example of an IoT-enabled business application where sensor input, backend processing, and mobile monitoring all work together.

---

## 2. Features of the Project

### Authentication
- User registration and login
- Password hashing using bcrypt
- JWT-based authentication
- Protected routes for sensitive operations

### Product Management
- Add, update, delete products
- Manage price per litre for each product

### Sales Management
- Record new sales
- Calculate total amount based on weight and unit price
- Store sales history
- Filter sales by date/category

### Stock Management
- Maintain available stock
- Update stock manually
- Detect mismatches when a sale consumes more stock than expected

### Analytics and Reporting
- Total earnings summary
- Transaction count
- Category-wise breakdown
- Stock-level visualization
- Detailed report generation for review

### Notifications
- Sale event notifications
- Stock mismatch notifications
- Firebase push notification support

### Multi-language Support
- English and Tamil UI support

---

## 3. Tech Stack

### Frontend
- React Native for mobile application development
- Expo for faster mobile app development and testing
- React Navigation for routing and drawer-based navigation
- AsyncStorage for local persistence of auth/session data
- Axios for HTTP requests
- React Native DateTimePicker for date selection
- Expo Print and Expo Sharing for PDF/report export
- React Native Gesture Handler and Reanimated for smoother mobile experience

### Backend
- Node.js runtime
- Express.js framework for building REST APIs
- PostgreSQL database
- pg driver for PostgreSQL communication
- JWT for authentication
- bcryptjs for password hashing
- Firebase Admin SDK for push notifications
- dotenv for environment management
- CORS for cross-origin access

### Database
- PostgreSQL relational database
- Tables for users, products, sales, stock, and notifications

### Dev Tools / Supporting Libraries
- Babel and Expo tooling
- ESLint / linting support
- Netlify/Expo deployment-oriented configuration files

---

## 4. Folder Structure and What Each Part Does

### Root
- package.json: main project dependencies for the web/Next.js layer
- README.md: project documentation

### Backend
- server.js: main server entry point
- routes/: defines API endpoints
- controllers/: contains business logic for auth, products, sales, and stock
- middleware/: authentication middleware
- config/: database, Firebase, and SQL schema setup

### Frontend
- App.js: root app wrapper
- src/context/: global state such as auth and language context
- src/navigation/: navigation structure and drawer layout
- src/screens/: screens like Login, Dashboard, Stock, Prices, Analytics, Notifications
- src/services/api.js: centralized API service layer

---

## 5. Architecture Explanation

### High-level architecture
This project follows a classic client-server architecture:

Client App -> API Layer -> Business Logic -> Database -> Response back to Client

### Request flow example: login
1. User enters email and password on the mobile app.
2. The app sends a POST request to /api/login.
3. The backend checks the user in PostgreSQL.
4. If credentials match, a JWT is generated.
5. The token is sent back to the app.
6. The app stores the token and uses it for future requests.

### Request flow example: creating a sale
1. The UI sends product_id, weight, and optional device token.
2. The backend validates the product.
3. It calculates total amount.
4. It records the sale in the sales table.
5. It updates stock in the stock table.
6. It optionally triggers a push notification.

---

## 6. Database Design

The core data model is relational and normalized enough for a small business application.

### Users Table
Stores login credentials and identity.
- id
- email
- password
- created_at

### Products Table
Stores product information.
- id
- name
- price_per_litre
- created_at
- updated_at

### Sales Table
Stores each transaction.
- id
- product_id
- user_id
- weight
- total_amount
- is_mismatch
- created_at

### Stock Table
Stores current available stock.
- id
- product_id
- available_stock
- last_updated

### Notifications Table
Stores notification-related records.
- id
- user_id
- product_name
- weight
- total_amount
- created_at

### Relationships
- One product can have many sales
- One product has one stock entry (via product_id)
- Users can create multiple sales

### Indexes Used
- sales by product_id
- sales by created_at
- notifications by user_id

This design supports simple reporting, filtering, and stock integrity checks.

---

## 7. Key Backend Modules

### Auth Controller
Responsibilities:
- validate login/register payloads
- compare hashes with bcrypt
- create JWT tokens
- return authenticated user details

### Products Controller
Responsibilities:
- fetch all products
- create new product
- update product price
- delete product and related records safely

### Sales Controller
Responsibilities:
- create a sale record
- calculate total amount
- check stock mismatch
- update stock logically
- return sales summaries and analytics

### Stock Controller
Responsibilities:
- fetch stock summary
- update stock values
- set total stock directly

### Middleware
- authentication middleware intercepts requests and checks JWT

---

## 8. Important Business Logic

### Sales calculation
The total amount is calculated as:

$$
\text{total amount} = \text{weight} \times \text{price per litre}
$$

This is a simple but critical business rule.

### Stock mismatch logic
If the reported sale weight is higher than the available stock, the system marks the sale as a mismatch.

This is important because it helps detect:
- inventory discrepancies
- manual entry errors
- possible theft or misuse

### Date filtering logic
The system supports filtering sales by:
- a single date
- a date range
- today’s records

The code uses PostgreSQL date conversions and timezone logic for India/IST handling.

---

## 9. Frontend Modules Explained

### Login Screen
- Accepts user credentials
- Calls auth API
- Stores token in AsyncStorage
- Redirects the user to the home dashboard

### Dashboard Screen
- Shows KPI cards for total earnings and transactions
- Displays current stock cards
- Allows filtering by date/category
- Supports report/export features

### Prices Screen
- Lists products and their prices
- Allows price editing in place

### Stock Screen
- Shows each product’s stock level
- Allows stock updates
- Supports deletion of product and associated data

### Analytics Screen
- Visualizes sales by category
- Visualizes stock levels
- Builds a detailed report modal with stock vs sales insight

### Notifications Screen
- Shows recent sales and mismatch-related updates

---

## 10. OOP Concepts in This Project

This project is not a traditional OOP-heavy codebase. It is mostly built using modular functions, components, and service-layer patterns.

Still, interviewers may expect you to connect the code to OOP ideas.

### Encapsulation
Each module hides its internal logic:
- controllers manage database operations
- screens manage UI-specific state
- services hide HTTP details

### Abstraction
The API service layer exposes simple methods like:
- login
- createSale
- getStock

The UI does not need to know the exact HTTP implementation details.

### Modularity
The code is separated into distinct concerns:
- routes
- controllers
- services
- screens
- context providers

### Separation of Concerns
Each layer has one primary job:
- UI layer = rendering and interaction
- Service layer = API communication
- Controller layer = business rules
- Database layer = persistence

### OOP interview answer you can give
Even though this project uses functional JavaScript and React components more than classical classes, it still demonstrates good object-oriented thinking through modular design, encapsulation, and separation of responsibilities.

---

## 11. DSA Concepts Involved

This is not a competitive-programming project, so you will not see heavy DSA structures like trees or graphs. However, core programming concepts are still present.

### Arrays and Objects
Used for storing lists of products, sales, and stock items.

### Mapping and Filtering
Used when rendering lists and processing filtered records.

### Reduction
Used for aggregations like total income and transaction counts.

Example idea:
- summing amounts across sales using reduce
- grouping earnings by product/category using object maps

### Hash Maps / Objects
Used for category summaries and grouped report data.

### Sorting
Used for arranging data by date or category.

### Time Complexity Awareness
For a project of this size, the main performance concern is database query efficiency rather than algorithmic complexity. Still, the app uses simple linear operations over small datasets.

### DSA interview answer you can give
The project is more about application-level data processing than advanced algorithm design. The important DSA-style thinking here is using arrays, objects, filters, maps, and reduce to process business data efficiently.

---

## 12. Computer Networks / Protocols Involved

From a computer networks perspective, this project uses several standard communication mechanisms.

### 1. HTTP / HTTPS
- The mobile app communicates with the backend using HTTP requests.
- In production, HTTPS is preferred for secure communication.
- This is the main protocol used for login, fetching products, creating sales, updating stock, and getting analytics.

### 2. REST API
- The backend exposes REST endpoints such as /api/login, /api/products, /api/sales, and /api/stock.
- REST is based on stateless client-server communication.
- Each request contains a method such as GET, POST, PUT, or DELETE.

### 3. JSON over HTTP
- The app and backend exchange data in JSON format.
- JSON is lightweight and easy to parse in both React Native and Node.js.
- Example: the frontend sends a sales payload and the backend returns a JSON response with transaction details.

### 4. JWT for authentication
- JWT is not a transport protocol itself, but it is a token-based authentication mechanism used over HTTP.
- After login, the server issues a JWT token.
- The client sends this token in the Authorization header for protected requests.

### 5. WebSocket-like concept for real-time notifications (conceptually)
- The project uses Firebase push notifications, which are based on modern messaging infrastructure.
- In a more advanced real-time system, WebSockets could be used for instant updates.
- For this project, push notification delivery is more important than a full bidirectional socket connection.

### 6. MQTT / IoT protocol (relevant in real IoT implementation)
- If this project were extended with real hardware sensors, MQTT would be a very relevant protocol.
- MQTT is lightweight and ideal for IoT devices with limited bandwidth.
- A weighing sensor or gateway could publish measurement data to an MQTT broker, and the backend could subscribe to it.
- This is especially useful for industrial or embedded systems.

### 7. TCP / IP fundamentals
- All these communications ultimately depend on TCP/IP.
- TCP ensures reliable delivery of packets.
- IP handles addressing and routing between devices.

### 8. DNS
- If the app connects to a deployed backend domain, DNS is used to resolve the server name to an IP address.

### 9. TLS / SSL
- HTTPS uses TLS to encrypt traffic.
- This ensures secure transfer of user credentials, sales data, and sensitive business information.

### 10. Why these protocols matter for this project
- HTTP/HTTPS: normal app-to-server communication
- REST: clean API design
- JSON: data exchange format
- JWT: secure authentication
- MQTT: likely protocol if real IoT sensors are added
- TCP/IP + TLS: underlying network reliability and security

### Interview-ready explanation
In networking terms, this project mainly uses HTTP/HTTPS and REST APIs for communication between the mobile app and backend. For authentication it uses JWT over HTTP. In a real IoT extension, MQTT would be a natural protocol for communicating sensor data from weighing devices to the server. Under the hood, everything works over TCP/IP and TLS for reliability and security.

---

## 13. Why This Project Is Good for Interviews

### Current system design
This is a small to medium-scale monolithic backend with modular services.

### Why this design works
- easy to build and deploy
- easier to understand for a small business app
- sufficient for a single product/service instance

### Components of the design
- mobile client
- REST API server
- PostgreSQL database
- authentication layer
- notification service

### Scalability considerations
If this system grows, you could scale it by:
- moving to a microservice-style architecture for auth, inventory, and sales
- adding caching for reads
- introducing queues for notifications
- using load balancers and a managed PostgreSQL service
- adding an event-driven architecture for asynchronous notifications

### Reliability concerns
- use transaction handling for sale + stock updates
- validate all inputs
- use database constraints and rollback logic
- log failures and monitor API health

### Security considerations
- password hashing
- JWT auth
- protected endpoints
- environment-based secret configuration
- CORS configuration

---

## 13. Why This Project Is Good for Interviews

This project is valuable because it demonstrates:
- full-stack development skills
- backend API design
- database design
- authentication flow
- business logic implementation
- UI state handling
- analytics/report generation
- real-world problem solving

It is a strong example of a practical, end-to-end application rather than a toy project.

---

## 14. Likely Interview Questions and Strong Answers

### Q1. What does this project do?
It is a sales and stock management system for a business. It allows users to manage products, update stock, record sales, view analytics, and receive notifications.

### Q2. How is authentication implemented?
Users register or log in using email and password. Passwords are hashed with bcrypt and JWT tokens are issued for subsequent authenticated requests.

### Q3. How do sales and stock work together?
When a sale is created, the system calculates the amount based on weight and price. It then updates the stock value and records whether the sale caused a mismatch.

### Q4. Why use PostgreSQL here?
PostgreSQL is reliable for structured business data, supports transactions, and works well with relational tables such as products, sales, and stock.

### Q5. What is the role of the controller layer?
Controllers handle request validation and business logic, while routes map endpoints and the database layer persists data.

### Q6. How do you prevent inconsistent data in a sale + stock transaction?
The backend uses transaction handling so that sale creation and stock update happen together. If one step fails, the transaction is rolled back.

### Q7. What is the purpose of the stock mismatch feature?
It detects cases where a sale consumes stock that is not available, which may indicate data issues or operational problems.

### Q8. What would you improve if this project scaled?
I would add caching, asynchronous notifications, better logging, API versioning, role-based access control, and perhaps separate services for inventory and analytics.

### Q9. What OOP concepts are reflected here?
The project uses encapsulation, abstraction, modularity, and separation of concerns even though it is not based on classes.

### Q10. What DSA-style thinking does this project use?
It uses list processing, grouping, filtering, mapping, reducing, sorting, and data aggregation to create reports and analytics.

---

## 15. Short Interview Introduction (30–60 seconds)

I built a full-stack sales and inventory management application called ScaleSync. The system allows businesses to manage product prices, update stock, record sales, calculate revenue, detect stock mismatches, and view analytics through a mobile interface. On the backend, I used Node.js and Express with PostgreSQL, and on the frontend I used React Native with Expo. The project demonstrates authentication, REST API design, relational database modeling, transactional updates, and report generation.

---

## 16. Key Takeaways for Interview Preparation

If you want to impress in an interview, be ready to explain:
- the user flow
- the database schema
- how auth works
- how sales affect stock
- how analytics are computed
- why the project is modular and scalable
- what trade-offs exist in the current design

---

## 17. Screenshots

![App Screenshot](https://github.com/IndhujaSadayappan/ScaleSync/blob/62e09268e4545fc6ba24e1cee00f5d30f8fd3059/images/Picture1.jpg)
![App Screenshot](https://github.com/IndhujaSadayappan/ScaleSync/blob/63eab9b0b9c8e9fe1a198913414ef56072066925/images/Picture2.jpg)
![App Screenshot](https://github.com/IndhujaSadayappan/ScaleSync/blob/63eab9b0b9c8e9fe1a198913414ef56072066925/images/Picture3.jpg).
