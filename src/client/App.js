// the main component of the app
import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';

function App() {
   // state variables to hold data
  const [ingredients, setIngredients] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [foodImage, setFoodImage] = useState('');
  const [foodTypes, setFoodTypes] = useState([]);
  const [headerImage, setHeaderImage] = useState('');
  const [selectedMeal, setSelectedMeal] = useState(null); 
// state variable to hold the selected meal 
  useEffect(() => {
    document.body.style.overflow = selectedMeal ? 'hidden' : 'auto';
  }, [selectedMeal]);
 // fetches random food image for the header
  const fetchHeaderImage = async () => {
    try {
      const res = await fetch('https://foodish-api.com/api/');
      const data = await res.json();
      setHeaderImage(data.image);
    } catch (error) {
      console.error('Error fetching header image:', error);
    }
  };
// fetches full recipe details (with ingredients)
  const getFullMealDetails = async (id) => {
    try {
      const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
      const data = await res.json();
      return data.meals[0];
    } catch (error) {
      console.error('Error fetching meal details:', error);
      return null;
    }
  };
// to fetch categoriesof of food 
  useEffect(() => {
    const fetchFoodTypes = async () => {
      try {
        const response = await fetch('https://www.themealdb.com/api/json/v1/1/categories.php');
        const data = await response.json();
        setFoodTypes(data.categories);
      } catch (error) {
        console.error('Error fetching food types:', error);
      }
    };
// fetches 10 random meals and retrieves full details (including ingredients)
    const fetchRandomRecipes = async () => {
      setLoading(true);
      try {
        const all = [];
        for (let i = 0; i < 10; i++) {
          const res = await fetch('https://www.themealdb.com/api/json/v1/1/random.php');
          const data = await res.json();
          if (data.meals && data.meals.length > 0) {
            const fullMeal = await getFullMealDetails(data.meals[0].idMeal);
            if (fullMeal) all.push(fullMeal);
          }
        }
        setRecipes(all);
      } catch (error) {
        console.error('Error fetching random recipes:', error);
      } finally {
        setLoading(false);
      }
    };
 // fetches a random food image for fallback 
    const fetchRandomFoodImage = async () => {
      try {
        const response = await fetch('https://www.themealdb.com/api/json/v1/1/random.php');
        const data = await response.json();
        setFoodImage(data.meals[0]?.strMealThumb || '');
      } catch (error) {
        console.error('Error fetching random food image:', error);
      }
    };

    fetchFoodTypes();
    fetchRandomRecipes();
    fetchRandomFoodImage();
  }, []);
// fetches a random food image for the header every 9 seconds
  // and sets a delay of 2 seconds before the first fetch
  useEffect(() => {
    const fetchImageWithDelay = async () => {
      await fetchHeaderImage();
      const interval = setInterval(() => {
        fetchHeaderImage();
      }, 9000);
      return () => clearInterval(interval);
    };

    const delayInterval = setTimeout(() => {
      fetchImageWithDelay();
    }, 2000);

    return () => clearTimeout(delayInterval);
  }, []);
// user clicks a food category to filter meals
  const handleFoodTypeClick = async (type) => {
    if (!type) return;
    setLoading(true);
    let allRecipes = [];

    try {
      const response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${type}`);
      const data = await response.json();

      if (data.meals) {
        const fullDetails = await Promise.all(
          data.meals.map((meal) => getFullMealDetails(meal.idMeal))
        );
        allRecipes = fullDetails.filter(Boolean);
      }

      setRecipes(allRecipes);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };
// handles ingredient-based recipe search
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ingredients) return;

    setLoading(true);
    const ingredientsArray = ingredients.split(',').map(i => i.trim().toLowerCase()).filter(Boolean);
// fetch recipes for each ingredient separately
    try {
      const mealsPerIngredient = [];
      for (let ingredient of ingredientsArray) {
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${ingredient}`);
        const data = await response.json();
        mealsPerIngredient.push(data.meals || []);
      }
// find common meals that contain all the input ingredients
      const commonMeals = mealsPerIngredient.reduce((acc, curr) => {
        const currMealIds = new Set(curr.map(meal => meal.idMeal));
        return acc.filter(meal => currMealIds.has(meal.idMeal));
      }, mealsPerIngredient[0] || []);
// fetch full details for matched meals
      const fullDetails = await Promise.all(
        commonMeals.map(meal => getFullMealDetails(meal.idMeal))
      );

      setRecipes(fullDetails.filter(Boolean));
    } catch (error) {
      console.error('Error fetching recipes:', error);
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-background d-flex flex-column animated-bg">
      {/* Header Section */}
      <header
        className="text-white text-center py-5 shadow"
        style={{
          backgroundImage: `url(${headerImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: '#0000'
        }}
      >
        <h1 className="display-4 mb-2">What Can I Cook?</h1>
        <p className="lead mb-4">“Enter your ingredients. We’ll do the rest!”</p>
        <div className="container">
          <form onSubmit={handleSubmit} className="row justify-content-center g-2">
            <div className="col-md-4">
              <input
                type="text"
                className="form-control form-control-lg"
                placeholder="e.g. chicken, rice, tomato"
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <select
                className="form-select form-select-lg"
                onChange={(e) => handleFoodTypeClick(e.target.value)}
                defaultValue=""
              >
                <option value="" disabled>Select food category</option>
                {foodTypes.map((type) => (
                  <option key={type.idCategory} value={type.strCategory}>
                    {type.strCategory}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-auto">
              <button type="submit" className="btn btn-light btn-lg shadow-sm">
                {loading ? 'Searching...' : 'Search Recipes'}
              </button>
            </div>
          </form>
        </div>
      </header>

      {/* Main Recipe Section */}
      <main className="container my-5">
        <div className="row">
          {loading ? (
            <div className="col-12 text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : recipes.length > 0 ? (
            recipes.map((meal) => (
              <div key={meal.idMeal} className="col-md-4 mb-4">
                <div className="card h-100 shadow-sm">
                  <img
                    src={meal.strMealThumb}
                    className="card-img-top"
                    alt={meal.strMeal}
                  />
                  <div className="card-body">
                    <h5 className="card-title">{meal.strMeal}</h5>
                    <ul className="list-unstyled small">
                      {Array.from({ length: 5 }).map((_, i) => {
                        const ingredient = meal[`strIngredient${i + 1}`];
                        const measure = meal[`strMeasure${i + 1}`];
                        return ingredient ? (
                          <li key={i}>
                            ✅ {ingredient} {measure && `- ${measure}`}
                          </li>
                        ) : null;
                      })}
                    </ul>
                    <button
                      className="btn btn-success"
                      onClick={() => setSelectedMeal(meal)}
                    >
                      View Recipe
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-12 text-center">
              <p>No recipes found. Try a different search!</p>
              {foodImage && <img src={foodImage} alt="Random food" className="img-fluid" />}
            </div>
          )}
        </div>
      </main>

      {/* Modal for full recipe */}
      {selectedMeal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{selectedMeal.strMeal}</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedMeal(null)}></button>
              </div>
              <div className="modal-body">
                <img src={selectedMeal.strMealThumb} className="img-fluid mb-3" alt={selectedMeal.strMeal} />
                <h6>Ingredients</h6>
                <ul>
                  {Array.from({ length: 20 }).map((_, i) => {
                    const ingredient = selectedMeal[`strIngredient${i + 1}`];
                    const measure = selectedMeal[`strMeasure${i + 1}`];
                    return ingredient && ingredient.trim() !== '' ? (
                      <li key={i}>{ingredient} {measure && `- ${measure}`}</li>
                    ) : null;
                  })}
                </ul>
                <h6 className="mt-4">Instructions</h6>
                <p>{selectedMeal.strInstructions}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-dark text-white text-center py-3 mt-auto">
        <small>&copy; {new Date().getFullYear()} Ackeem Woodley | Made with 🍳 + ❤️</small>
      </footer>
    </div>
  );
}

export default App;

