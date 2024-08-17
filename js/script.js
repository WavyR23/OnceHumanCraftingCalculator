document.addEventListener('DOMContentLoaded', function () {
    const categorySelect = document.getElementById('category-select');
    const subcategorySelect = document.getElementById('subcategory-select');
    const subcategorySection = document.querySelector('.subcategory-selection');
    const recipeOptions = document.getElementById('recipe-options');
    let currentRecipes = {};
    let materialsData = {};

    // Function to load materials from JSON file
    function loadMaterials() {
        return fetch('data/materials.json')
            .then(response => response.json())
            .then(data => {
                materialsData = data;
            })
            .catch(error => console.error('Error loading materials:', error));
    }

    // Function to load categories from JSON file
    function loadCategories() {
        fetch('data/categories.json')
            .then(response => response.json())
            .then(data => {
                const categories = data.categories;
                categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.folder;
                    option.textContent = category.name;
                    option.setAttribute('data-subcategories', JSON.stringify(category.subcategories));
                    categorySelect.appendChild(option);
                });
            })
            .catch(error => console.error('Error loading categories:', error));
    }

    // Function to load subcategories based on selected category
    function loadSubcategories(subcategories) {
        subcategorySelect.innerHTML = '<option value="">Select a Subcategory</option>'; // Clear previous subcategories
        subcategories.forEach(subcategory => {
            const option = document.createElement('option');
            option.value = subcategory.file;
            option.textContent = subcategory.name;
            subcategorySelect.appendChild(option);
        });
        subcategorySection.style.display = 'block'; // Show subcategory dropdown
    }

    // Function to load recipes based on selected subcategory
    function loadRecipes(categoryFolder, subcategoryFile) {
        fetch(`data/${categoryFolder}/${subcategoryFile}`)
            .then(response => response.json())
            .then(data => {
                currentRecipes = data;
                displayRecipes(currentRecipes);
            })
            .catch(error => console.error('Error loading recipes:', error));
    }

    // Function to display recipes in the UI
    function displayRecipes(recipes) {
        recipeOptions.innerHTML = ''; // Clear previous recipes
        for (let subcategory in recipes) {
            for (let recipe in recipes[subcategory]) {
                const recipeData = recipes[subcategory][recipe];

                const div = document.createElement('div');
                const label = document.createElement('label');
                const checkbox = document.createElement('input');
                const quantityInput = document.createElement('input');
                const img = document.createElement('img');

                checkbox.type = 'checkbox';
                checkbox.name = 'recipe';
                checkbox.value = recipe;

                img.src = recipeData.image;
                img.alt = recipe;
                img.style.width = '50px';
                img.style.height = '50px';
                img.style.marginRight = '10px';

                label.appendChild(img);
                label.appendChild(checkbox);
                label.appendChild(document.createTextNode(` ${recipe}`));

                // Quantity input field
                quantityInput.type = 'number';
                quantityInput.min = '1';
                quantityInput.value = '1';
                quantityInput.className = 'quantity-input';
                quantityInput.style.marginLeft = '10px';

                // Append both the checkbox and the input to the div container
                div.appendChild(label);
                div.appendChild(quantityInput);
                recipeOptions.appendChild(div);
            }
        }
    }

    // Function to calculate total materials required based on selected recipe(s) and their quantities
    function calculateTotalMaterials() {
        const selectedRecipes = Array.from(document.querySelectorAll('input[name="recipe"]:checked'));

        let totalMaterials = {};

        selectedRecipes.forEach(checkbox => {
            const recipe = checkbox.value;
            const quantityInput = checkbox.parentElement.querySelector('.quantity-input');
            const quantity = parseInt(quantityInput.value);

            console.log(`Calculating for recipe: ${recipe} with quantity: ${quantity}`);

            for (let subcategory in currentRecipes) {
                if (currentRecipes[subcategory][recipe]) {
                    const materials = currentRecipes[subcategory][recipe].materials;
                    for (let material in materials) {
                        const requiredAmount = materials[material] * quantity;

                        if (totalMaterials[material]) {
                            totalMaterials[material].amount += requiredAmount;
                        } else {
                            totalMaterials[material] = {
                                amount: requiredAmount,
                                image: materialsData[material].image,
                                unit: materialsData[material].unit
                            };
                        }
                    }
                }
            }
        });

        console.log("Total Materials Calculated:", totalMaterials);
        displayResults(totalMaterials);
    }

    // Function to display the calculation results
    function displayResults(totalMaterials) {
        const materialsList = document.getElementById('materials-list');
        materialsList.innerHTML = '';  // Clear previous results

        if (Object.keys(totalMaterials).length === 0) {
            const li = document.createElement('li');
            li.textContent = 'No recipe selected.';
            materialsList.appendChild(li);
        } else {
            for (let material in totalMaterials) {
                const li = document.createElement('li');
                const img = document.createElement('img');
                const text = document.createElement('span');

                img.src = totalMaterials[material].image;
                img.alt = material;
                img.style.width = '50px';
                img.style.height = '50px';
                img.style.marginRight = '10px';

                text.textContent = `${material}: ${totalMaterials[material].amount} ${totalMaterials[material].unit}`;

                li.appendChild(img);
                li.appendChild(text);
                materialsList.appendChild(li);
            }
        }
    }

    // Event listener for category selection
    categorySelect.addEventListener('change', function() {
        const selectedCategoryFolder = this.value;
        const subcategories = JSON.parse(this.selectedOptions[0].getAttribute('data-subcategories'));
        if (selectedCategoryFolder && subcategories) {
            loadSubcategories(subcategories);
        } else {
            subcategorySection.style.display = 'none';
            recipeOptions.innerHTML = ''; // Clear recipes if no category is selected
        }
    });

    // Event listener for subcategory selection
    subcategorySelect.addEventListener('change', function() {
        const selectedSubcategoryFile = this.value;
        const selectedCategoryFolder = categorySelect.value;
        if (selectedSubcategoryFile && selectedCategoryFolder) {
            loadRecipes(selectedCategoryFolder, selectedSubcategoryFile);
        }
    });

    // Add event listener for the calculate button
    document.getElementById('calculate-button').addEventListener('click', calculateTotalMaterials);

    // Load materials and categories on page load
    loadMaterials().then(loadCategories);
});
