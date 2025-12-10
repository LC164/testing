function updateFileName() {
      const fileInput = document.getElementById('imageInput');
      const fileNameSpan = document.getElementById('fileName');
      
      
      if (fileInput.files.length > 0) {
        fileNameSpan.textContent = fileInput.files[0].name;
        fileNameSpan.classList.add('has-file');
      } else {
        fileNameSpan.textContent = 'No file chosen';
        fileNameSpan.classList.remove('has-file');
      }
    }

    async function sendImage() {
      const fileInput = document.getElementById('imageInput');
      const file = fileInput.files[0];
      if (!file) {
        alert("Please select an image first.");
        return;
      }

      const messages = document.getElementById('messages');
      const userMsg = document.createElement('div');
        userMsg.className = 'message user';
        userMsg.textContent = file.name;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            userMsg.appendChild(img);
        };
        reader.readAsDataURL(file);
      messages.appendChild(userMsg);
      messages.scrollTop = messages.scrollHeight;

      const formData = new FormData();
      formData.append("image", file);

      try {
        const response = await fetch("https://api.imagga.com/v2/tags", {
          method: "POST",
          headers: {
            "Authorization": "Basic " + btoa("acc_7c2ba56e833b27b:5b186a166b11692b60146c913efcdddb")
          },
          body: formData
        });

        const data = await response.json();

        if (data.result && data.result.tags && data.result.tags.length > 0) {
          const sorted = data.result.tags.sort((a, b) => b.confidence - a.confidence);
          const bestTag = sorted[0].tag.en;

          const botMsg = document.createElement('div');
          botMsg.className = 'message bot';
          botMsg.textContent = "I think this is a " + bestTag + "! Let me get the nutrition facts...";
          messages.appendChild(botMsg);
          messages.scrollTop = messages.scrollHeight;

          const nutritionInfo = await fetchNutrition(bestTag);
          const botMsg2 = document.createElement('div');
          botMsg2.className = 'message bot';
          botMsg2.textContent = nutritionInfo;
          messages.appendChild(botMsg2);
          messages.scrollTop = messages.scrollHeight;
        } else {
          const botMsg = document.createElement('div');
          botMsg.className = 'message bot';
          botMsg.textContent = "Sorry, I couldn't recognize that image. Could you try another one?";
          messages.appendChild(botMsg);
          messages.scrollTop = messages.scrollHeight;
        }
      } catch (err) {
        console.error(err);
        const botMsg = document.createElement('div');
        botMsg.className = 'message bot';
        botMsg.textContent = "Oops! I'm having trouble connecting to the image recognition service. Please try again.";
        messages.appendChild(botMsg);
        messages.scrollTop = messages.scrollHeight;
      }

      fileInput.value = '';
      updateFileName();
    }

    async function fetchNutrition(foodName) {
      try {
        const response = await fetch(
          `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(foodName)}&api_key=RpAcmnyw2tz1pQp7m38vjDZCy5Q4OYMSu3zes3RM`
        );
        const data = await response.json();

        if (data.foods && data.foods.length > 0) {
          const food = data.foods[0];
          const nutrients = food.foodNutrients;

          const calories = nutrients.find(n => n.nutrientName === "Energy")?.value || "N/A";
          const protein = nutrients.find(n => n.nutrientName === "Protein")?.value || "N/A";
          const fat = nutrients.find(n => n.nutrientName === "Total lipid (fat)")?.value || "N/A";
          const carbs = nutrients.find(n => n.nutrientName === "Carbohydrate, by difference")?.value || "N/A";

          return `📊 Nutrition Facts (per 100g):\n\n🔥 Calories: ${calories} kcal\n💪 Protein: ${protein} g\n🥑 Fat: ${fat} g\n🌾 Carbs: ${carbs} g`;
        } else {
          return "I couldn't find nutrition information for that food item.";
        }
      } catch (err) {
        console.error(err);
        return "Sorry, I encountered an error fetching nutrition facts.";
      }

    }
