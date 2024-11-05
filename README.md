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