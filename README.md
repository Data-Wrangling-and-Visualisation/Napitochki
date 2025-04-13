# Napitochki
Project goal is to develop the visualisation application for different drinks (like lemonades, coffee drinks, teas etc.) grouped according to their flavors.

### Key Objectives
- Interactive Exploration:
Allow users to explore drinks based on their taste preferences, making it easier to
find new favorites.
- Flavor Mapping:
Provide a visual representation of how dierent drinks relate to each other in
terms of taste, helping users understand the flavor landscape.

### Repository structure
- **backend** - folder contains containerized backend written on Rust🚀
- **data** - folder for storing data for EDA and preprocessing
- **data_collection** - data scrapping from monin.ru
- **data_exploration** - EDA
- **data_processing** - tastes and embeddings extraction and pushing them into chromadb
- **frontend** - currently in development, contains frontend on react.js and d3.js

Requirements for python-part (data collection, exploration, processing) are stored in requirements.txt

Requirements for rust-part (backend) are stored in backend/Cargo.toml

### Current stage of the project
- Data for backend is prepared.
- Backend is deployed at http://89.169.174.146:8888, there is a documentation for endpoints in postman:
  https://www.postman.com/warped-star-370484/dwv/collection/qqehskr/drinks
- Frontend is in development and available at http://89.169.174.146:5173
