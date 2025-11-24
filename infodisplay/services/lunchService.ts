import { Restaurant } from '../types';

// Since we don't have the actual Python backend or a proxy to scrape lounaat.info,
// we mock the data for the specific restaurants requested.
export const fetchLunchData = async (): Promise<Restaurant[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const today = new Date().toLocaleDateString('fi-FI', { weekday: 'long', day: 'numeric', month: 'numeric' });
  
  return [
    {
      restaurant: "Food & Co Tulli Business Park",
      menu: [
        {
          date: today,
          menu: [
            { dish: "Meatballs in Cream Sauce", price: "12.70€", info: "L, G" },
            { dish: "Roasted Salmon & Dill Potatoes", price: "13.50€", info: "L, G" },
            { dish: "Vegetable Curry with Rice", price: "11.90€", info: "V, G" }
          ]
        }
      ]
    },
    {
      restaurant: "Ravintola Myllärit",
      menu: [
        {
          date: today,
          menu: [
            { dish: "Myllärit's Pepper Steak", price: "24.00€", info: "L, G" },
            { dish: "Fried Arctic Char", price: "16.00€", info: "L, G" },
            { dish: "Mushroom Risotto", price: "14.50€", info: "L, G" }
          ]
        }
      ]
    },
    {
      restaurant: "Old Mates",
      menu: [
        {
          date: today,
          menu: [
            { dish: "Old Mates Burger", price: "13.50€", info: "L" },
            { dish: "Fish & Chips", price: "14.00€", info: "L" },
            { dish: "Halloumi Salad", price: "12.50€", info: "G" }
          ]
        }
      ]
    },
    {
      restaurant: "Ravintola Aleksis",
      menu: [
        {
          date: today,
          menu: [
            { dish: "Buffet Lunch", price: "13.50€", info: "L, G" },
            { dish: "Soup of the Day", price: "10.50€", info: "L, G" }
          ]
        }
      ]
    },
    {
      restaurant: "Edun Herkkukeidas Eetwartti",
      menu: [
        {
          date: today,
          menu: [
            { dish: "Traditional Minced Meat Soup", price: "9.50€", info: "M, G" },
            { dish: "Wiener Schnitzel", price: "12.00€", info: "L" }
          ]
        }
      ]
    },
    {
      restaurant: "Le Momento Ratina",
      menu: [
        {
          date: today,
          menu: [
            { dish: "Pizza Buffet", price: "12.90€", info: "L" },
            { dish: "Pasta Carbonara", price: "12.90€", info: "L" },
            { dish: "Chicken Caesar Salad", price: "12.90€", info: "L, G" }
          ]
        }
      ]
    }
  ];
};