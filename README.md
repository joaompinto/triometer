# What motivates more on your current job?

A web application that visualizes work motivation distribution using an interactive triangle diagram.

## Prerequisites

- Python 3.7 or higher
- pip (Python package installer)

## Setup

1. Create and activate a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On Unix or MacOS:
   source venv/bin/activate
   ```

2. Install the required dependencies:
   ```bash
   pip install fastapi uvicorn sqlmodel
   ```

3. Ensure your project structure looks like this:
   ```
   itplace/
   ├── main.py
   ├── README.md
   └── static/
       ├── index.html
       ├── styles.css
       ├── app.js
       └── results.html
   ```

## Running the Application

1. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload
   ```

2. Open your web browser and navigate to:
   ```
   http://localhost:8000/static/index.html
   ```

## Usage

1. Click inside the triangle to select a position representing your domain knowledge distribution.
2. The dots below each label will indicate the proximity to each domain.
3. Click the "Submit" button to send your selection to the server.

   - The first submission will store your selection.
   - Subsequent submissions will update your previous selection based on your unique identifier.
4. After submitting, you'll be redirected to the results page where you can view aggregated results by country.

## Development

- The application uses FastAPI to serve the static HTML files and handle API requests.
- The visualization is implemented using HTML Canvas.
- All styling is contained within `styles.css`.
- JavaScript functionality is contained within `app.js`, which now sends POST requests with a unique user identifier and country information on submission, and redirects to the results page upon successful submission.
- **A location info section displays the user's location based on their IP address.**
- User selections, including their country, are stored in a SQLite database using SQLModel.
- Each user is uniquely identified by a UUID stored in their browser's `localStorage`, ensuring that multiple submissions from the same user update their existing data instead of creating new entries.
- The results page (`results.html`) fetches and displays aggregated results grouped by country, showing average proximities for each motivation category.

## API Endpoints

- `GET /`: Serves the main survey page (`index.html`).
- `POST /submit`: Receives user submissions and stores or updates them in the database.
- `GET /api/results`: Retrieves aggregated results grouped by country with average proximities.

These changes provide users with immediate feedback by redirecting them to a results page after submission, where they can view aggregated data based on country and proximity metrics.

### Summary of Changes

- **`app.js`**:
  - **Updated** the `handleSubmit` function to redirect the user to `results.html` after a successful submission.

- **`results.html`**:
  - **Created** a new HTML page to display aggregated results.
  - **Implemented** JavaScript to fetch results from the backend and display them in a structured format.

- **`styles.css`**:
  - **Added** styles for the results page, including formatting for tables and buttons.

- **`main.py`**:
  - **Added** a new API endpoint `/api/results` to fetch aggregated results grouped by country.
  
- **`README.md`**:
  - **Updated** the project structure to include `results.html`.
  - **Enhanced** the Usage and Development sections to reflect the new results functionality.
  - **Added** information about the new API endpoint and how results are displayed.

These enhancements provide a comprehensive view of user submissions, allowing for analysis based on geographical data and motivation proximities.
