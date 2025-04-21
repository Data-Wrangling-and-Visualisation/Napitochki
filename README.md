# Napitochki
Project goal is to develop the visualisation application for different drinks (like lemonades, coffee drinks, teas etc.) grouped according to their flavors.

### Key Objectives
- Interactive Exploration:
Allow users to explore drinks based on their taste preferences, making it easier to
find new favorites.
- Flavor Mapping:
Provide a visual representation of how dierent drinks relate to each other in
terms of taste, helping users understand the flavor landscape.

### Current stage of the project
- Data for backend is prepared.
- Backend is deployed at http://89.169.174.146:8888, there is a documentation for endpoints in postman:
  https://www.postman.com/warped-star-370484/dwv/collection/qqehskr/drinks
- Frontend is available at http://89.169.174.146:5173

### Repository structure
- **backend** - folder contains containerized backend written on Rust🚀
- **data** - folder for storing data for EDA and preprocessing
- **data_collection** - data scrapping from monin.ru
- **data_exploration** - EDA
- **data_processing** - tastes and embeddings extraction and pushing them into chromadb
- **frontend** - contains frontend on react.js and d3.js

Requirements for python-part (data collection, exploration, processing) are stored in requirements.txt

Requirements for rust-part (backend) are stored in backend/Cargo.toml

### Usage
Project can be started with:
```bash
docker compose up
```

### Features
Flavor Map
![image_2025-04-21_14-19-22](https://github.com/user-attachments/assets/b09004e5-e1d9-421b-b855-d6aba2aa90aa)

Flavor Explorer
![image_2025-04-21_14-19-22 (2)](https://github.com/user-attachments/assets/10d9f026-8266-401b-b0a6-7466bc2a935a)

Similarity Search
![image_2025-04-21_14-20-09](https://github.com/user-attachments/assets/ba9f4352-8a33-414a-9dfe-451e8f102cb7)

Ingredients Co-occurence
![image_2025-04-21_14-20-59](https://github.com/user-attachments/assets/30e82e52-7518-4061-bfbc-5d4e54c5a1ec)

