const axios = require('axios');
const fs = require('fs');
const csvWriter = require('csv-writer').createObjectCsvWriter;

// Step 1: GraphQL API Query......

async function fetchCountries() {
    try {
      // Send the GraphQL query using fetch
      const response = await fetch('https://countries.trevorblades.com/', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          query: `{
            countries {
              name
              capital
              currency
            }
          }`
        })
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      // Parse the JSON data from the response
      const data = await response.json();
      
      // Return the countries data
      return data.data.countries;
  
    } catch (error) {
      console.error('Error fetching countries:', error);
      throw error;
    }
  }
  
// Post country details to REST API
async function postCountryDetails(country) {
    const restEndpoint = 'https://jsonplaceholder.typicode.com/posts';
    const data = {
      title: `Country: ${country.name}`,
      body: `Capital: ${country.capital}, Currency: ${country.currency}`,
      userId: 1,
    };
  
    try {
      const response = await axios.post(restEndpoint, data);
      console.log(`Posted: ${country.name}`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.error(`Forbidden for ${country.name}, skipping.`);
      } else {
        console.error(`Error posting for ${country.name}:`, error.message);
      }
      throw error;
    }
  }
// Retry logic for 500 errors with exponential backoff

  async function postWithRetry(country, retries = 3, delay = 1000) {
    while (retries > 0) {
      try {
        return await postCountryDetails(country);
      } catch (error) {
        if (error.response?.status === 500) {
          console.log(`500 error for ${country.name}, retrying in ${delay / 1000}s...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          retries--;
          delay *= 2;
        } else {
          throw error;
        }
      }
    }
    console.error(`Failed to post after retries for ${country.name}.`);
  }
// Save countries to CSV
  async function saveToCSV(countries) {
    const csv = csvWriter({
      path: 'countries.csv',
      header: [
        { id: 'name', title: 'Country Name' },
        { id: 'capital', title: 'Capital' },
        { id: 'currency', title: 'Currency' },
      ],
    });
  
    await csv.writeRecords(countries);
    console.log('Countries saved to CSV.');
  }

  // Main workflow
async function automateProcess() {
    try {
      const countries = await fetchCountries();
      console.log(`Fetched ${countries?.length} countries.`);
  
      // Post details of the first country (can be modified to select a random one)
      await postWithRetry(countries[0]);
  
      // Save all countries to CSV
      await saveToCSV(countries);
    } catch (error) {
      console.error('Automation error:', error);
    }
  }
  
  // Run the automation
  automateProcess();
