# Electoral College Predictor MVP

## Project Description

The Electoral College Predictor is a web application that allows users to input polling data for each state in the US presidential election and calculates the probability of a candidate winning the election. This MVP (Minimum Viable Product) version provides a basic implementation of the core functionality.

## Features

- Input interface for entering poll percentages and margin of error for each state
- Calculation of win probability for each state based on poll data
- Computation of overall win probability for the election
- Simple, responsive web interface

## Technology Stack

- Backend: Python with Flask
- Frontend: HTML, JavaScript
- Deployment: Heroku

## How It Works

1. Users input poll percentages and margin of error for each state (or, alternatively, select a win probability using a sliding scale).
2. The application uses a normal distribution model to convert poll data into win probabilities for each state.
3. The overall win probability is calculated by combining the individual state probabilities.
4. The distribution of probabilities of total electoral college votes is displayed in the web interface.

## MVP Plan

1. Create basic Flask application (30 mins)
   - Set up the basic application structure
   - Create a simple route to render the main page
2. Create initial templates (1 hour)
   - Design a basic form interface for state polling data
   - Create a responsive grid layout for all 50 states + DC
3. Set up basic state data structure (30 mins)
   - Create a Python dictionary/class to hold state electoral votes
   - Implement basic validation for poll inputs

### Next Steps After Initial Setup:

1. Implement the statistical calculation logic (2-3 hours)
2. Add JavaScript for interactive features (2-3 hours)
3. Create visualization components (2-3 hours)
4. Add basic styling and responsiveness (2 hours)

### Total MVP Timeline:

- Initial Setup: 2-3 hours
- Core Functionality: 6-9 hours
- Testing and Refinement: 2-3 hours

Total: 10-15 hours for a basic working MVP