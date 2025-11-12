let names = []; // Array of objects: {name: string, isLast: boolean}
let currentDraftOrder = [];
let isLocked = false; // Locked when loaded from share link

// Animation control variables
let countdownInterval = null;
let animationTimeouts = [];

// DOM elements
const nameInput = document.getElementById('nameInput');
const addButton = document.getElementById('addButton');
const randomizeButton = document.getElementById('randomizeButton');
const clearButton = document.getElementById('clearButton');
const nameList = document.getElementById('nameList');
const draftOrder = document.getElementById('draftOrder');
const shareLinkButton = document.getElementById('shareLinkButton');
const resetSection = document.getElementById('resetSection');
const resetButton = document.getElementById('resetButton');
const revealSection = document.getElementById('revealSection');
const revealButton = document.getElementById('revealButton');
const fastForwardButton = document.getElementById('fastForwardButton');
const countdownDisplay = document.getElementById('countdownDisplay');
const draftMusic = document.getElementById('draftMusic');
const introMusic = document.getElementById('introMusic');

// Add name when button is clicked
addButton.addEventListener('click', addName);

// Add name when Enter is pressed
nameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addName();
    }
});

// Randomize button
randomizeButton.addEventListener('click', randomizeOrder);

// Clear button
clearButton.addEventListener('click', clearAll);

// Share link button
shareLinkButton.addEventListener('click', copyShareLink);

// Reset button (only shown when locked from share link)
resetButton.addEventListener('click', resetToCreateOwn);

// Reveal button (shown when loaded from share link)
revealButton.addEventListener('click', revealDraftOrder);

// Fast forward button (skip animations)
fastForwardButton.addEventListener('click', skipAnimations);

// Load saved data on page load
window.addEventListener('DOMContentLoaded', () => {
    // Hide share section initially (will be shown after randomization completes)
    document.querySelector('.share-section').style.display = 'none';
    
    // Check for URL parameters (shared link)
    const loadedFromURL = loadFromURL();
    // Update reset button visibility (in case not loaded from URL)
    // Only update if not loaded from URL (share link pages handle their own visibility)
    if (!loadedFromURL) {
        updateResetButtonVisibility();
    }
});

function addName() {
    if (isLocked) {
        alert('This draft order is locked and cannot be modified.');
        return;
    }
    
    const name = nameInput.value.trim();
    
    if (name === '') {
        return;
    }
    
    // Check for duplicates
    if (names.some(n => n.name === name)) {
        alert('This name has already been added!');
        nameInput.value = '';
        return;
    }
    
    // Default weights: odds for first = 10, regular = 5, last pick = 1
    names.push({ name: name, isLast: false, hasOddsForFirst: false, weight: 5 });
    nameInput.value = '';
    updateNameList();
    updateRandomizeButton();
}

function removeName(nameObjToRemove) {
    if (isLocked) {
        alert('This draft order is locked and cannot be modified.');
        return;
    }
    
    names = names.filter(nameObj => nameObj !== nameObjToRemove);
    updateNameList();
    updateRandomizeButton();
    // Clear draft order if a name is removed
    currentDraftOrder = [];
    draftOrder.innerHTML = '';
}

// Get default weight based on flags
function getDefaultWeight(nameObj) {
    if (nameObj.hasOddsForFirst) {
        return 10; // Highest weight for odds for first
    } else if (nameObj.isLast) {
        return 1; // Lowest weight for last pick
    } else {
        return 5; // Default weight for regular names
    }
}

function toggleLastPick(nameObj) {
    if (isLocked) {
        return;
    }
    
    // If setting this name as last pick, first unset any other names marked as last pick
    if (!nameObj.isLast) {
        // Unset all other names that are currently last pick
        names.forEach(n => {
            if (n !== nameObj && n.isLast) {
                n.isLast = false;
                n.weight = getDefaultWeight(n); // Update weight
            }
        });
    }
    
    // Toggle the current name's last pick status
    nameObj.isLast = !nameObj.isLast;
    // Update weight based on new status (unless user has set custom weight)
    if (!nameObj.hasCustomWeight) {
        nameObj.weight = getDefaultWeight(nameObj);
    }
    updateNameList();
    // Clear draft order if last pick status changes
    currentDraftOrder = [];
    draftOrder.innerHTML = '';
}

function toggleOddsForFirst(nameObj) {
    if (isLocked) {
        return;
    }
    
    // Toggle the current name's odds for first status
    nameObj.hasOddsForFirst = !nameObj.hasOddsForFirst;
    // Update weight based on new status (unless user has set custom weight)
    if (!nameObj.hasCustomWeight) {
        nameObj.weight = getDefaultWeight(nameObj);
    }
    updateNameList();
    // Clear draft order if odds for first status changes
    currentDraftOrder = [];
    draftOrder.innerHTML = '';
}

function updateWeight(nameObj, newWeight) {
    if (isLocked) {
        return;
    }
    
    const weight = Math.max(1, Math.min(100, parseInt(newWeight) || 5)); // Clamp between 1 and 100
    nameObj.weight = weight;
    nameObj.hasCustomWeight = true;
    updateNameList();
    // Clear draft order if weight changes
    currentDraftOrder = [];
    draftOrder.innerHTML = '';
}

function adjustWeight(nameObj, delta) {
    if (isLocked) {
        return;
    }
    
    // Get min and max bounds based on name type
    let minWeight = 1;
    let maxWeight = 100;
    
    if (nameObj.isLast) {
        // Last pick: weight should be less than regular names (max 4, since regular default is 5)
        maxWeight = 4;
    } else if (nameObj.hasOddsForFirst) {
        // Odds for first: weight should be higher than regular names (min 6, since regular default is 5)
        minWeight = 6;
    } else {
        // Regular name: weight should be between last pick (1) and odds for first (10)
        minWeight = 2; // Above last pick
        maxWeight = 9; // Below odds for first
    }
    
    const newWeight = Math.max(minWeight, Math.min(maxWeight, nameObj.weight + delta));
    nameObj.weight = newWeight;
    nameObj.hasCustomWeight = true;
    updateNameList();
    // Clear draft order if weight changes
    currentDraftOrder = [];
    draftOrder.innerHTML = '';
}

function updateNameList() {
    nameList.innerHTML = '';
    
    // Disable input and add button when locked
    if (isLocked) {
        nameInput.disabled = true;
        nameInput.placeholder = 'Draft order is locked';
        nameInput.style.opacity = '0.6';
        nameInput.style.cursor = 'not-allowed';
        addButton.disabled = true;
        addButton.style.opacity = '0.6';
        addButton.style.cursor = 'not-allowed';
    } else {
        nameInput.disabled = false;
        nameInput.placeholder = 'Enter a name and press Enter';
        nameInput.style.opacity = '1';
        nameInput.style.cursor = 'text';
        addButton.disabled = false;
        addButton.style.opacity = '1';
        addButton.style.cursor = 'pointer';
    }
    
    if (names.length === 0) {
        return;
    }
    
    names.forEach(nameObj => {
        // Ensure isLast and hasOddsForFirst are always booleans
        if (typeof nameObj.isLast !== 'boolean') {
            nameObj.isLast = false;
        }
        if (typeof nameObj.hasOddsForFirst !== 'boolean') {
            nameObj.hasOddsForFirst = false;
        }
        // Ensure weight exists and is a number
        if (typeof nameObj.weight !== 'number' || isNaN(nameObj.weight)) {
            nameObj.weight = getDefaultWeight(nameObj);
            nameObj.hasCustomWeight = false;
        }
        
        // Create wrapper for name tag and hover button
        const wrapper = document.createElement('div');
        wrapper.className = 'name-tag-wrapper';
        if (!nameObj.isLast) {
            wrapper.classList.add('name-tag-wrapper-regular');
        }
        
        const tag = document.createElement('div');
        tag.className = 'name-tag';
        if (nameObj.isLast) {
            tag.classList.add('name-tag-last');
        }
        if (nameObj.hasOddsForFirst) {
            tag.classList.add('name-tag-odds-first');
        }
        
        const span = document.createElement('span');
        span.textContent = nameObj.name;
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove';
        removeBtn.textContent = '×';
        removeBtn.setAttribute('aria-label', `Remove ${nameObj.name}`);
        if (isLocked) {
            removeBtn.disabled = true;
            removeBtn.style.opacity = '0.5';
            removeBtn.style.cursor = 'not-allowed';
        }
        removeBtn.addEventListener('click', () => removeName(nameObj));
        
        // Toggle last pick button (shown inline in pill on hover, or always visible if already last pick)
        const lastBtn = document.createElement('button');
        lastBtn.className = 'last-toggle';
        if (nameObj.isLast) {
            lastBtn.textContent = '💩';
            lastBtn.title = 'Remove from last pick';
            lastBtn.setAttribute('aria-label', 'Remove from last pick');
            lastBtn.classList.add('last-toggle-remove');
        } else {
            lastBtn.textContent = '💩';
            lastBtn.title = 'Make last pick';
            lastBtn.setAttribute('aria-label', 'Make last pick');
            lastBtn.classList.add('last-toggle-hover'); // Hidden by default, shown on hover
        }
        if (isLocked) {
            lastBtn.disabled = true;
            lastBtn.style.opacity = '0.5';
            lastBtn.style.cursor = 'not-allowed';
        } else {
            lastBtn.addEventListener('click', () => toggleLastPick(nameObj));
        }
        
        // Toggle odds for first button (shown inline in pill on hover, or always visible if already marked)
        const oddsBtn = document.createElement('button');
        oddsBtn.className = 'odds-toggle';
        if (nameObj.hasOddsForFirst) {
            oddsBtn.textContent = '⭐';
            oddsBtn.title = 'Remove odds for first';
            oddsBtn.setAttribute('aria-label', 'Remove odds for first');
            oddsBtn.classList.add('odds-toggle-remove');
        } else {
            oddsBtn.textContent = '⭐';
            oddsBtn.title = 'Mark as odds for first';
            oddsBtn.setAttribute('aria-label', 'Mark as odds for first');
            oddsBtn.classList.add('odds-toggle-hover'); // Hidden by default, shown on hover
        }
        if (isLocked) {
            oddsBtn.disabled = true;
            oddsBtn.style.opacity = '0.5';
            oddsBtn.style.cursor = 'not-allowed';
        } else {
            oddsBtn.addEventListener('click', () => toggleOddsForFirst(nameObj));
        }
        
        // Add +/- buttons for regular names (not odds for first, not last pick)
        let weightAdjustButtons = null;
        if (!nameObj.isLast && !nameObj.hasOddsForFirst && !isLocked) {
            weightAdjustButtons = document.createElement('div');
            weightAdjustButtons.className = 'weight-adjust-buttons';
            
            const decreaseBtn = document.createElement('button');
            decreaseBtn.className = 'weight-adjust-btn weight-decrease-btn';
            decreaseBtn.textContent = '−';
            decreaseBtn.title = 'Decrease weight';
            decreaseBtn.setAttribute('aria-label', 'Decrease weight');
            decreaseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                adjustWeight(nameObj, -1);
            });
            
            const increaseBtn = document.createElement('button');
            increaseBtn.className = 'weight-adjust-btn weight-increase-btn';
            increaseBtn.textContent = '+';
            increaseBtn.title = 'Increase weight';
            increaseBtn.setAttribute('aria-label', 'Increase weight');
            increaseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                adjustWeight(nameObj, 1);
            });
            
            weightAdjustButtons.appendChild(decreaseBtn);
            weightAdjustButtons.appendChild(increaseBtn);
        }
        
        tag.appendChild(span);
        if (weightAdjustButtons) {
            tag.appendChild(weightAdjustButtons);
        }
        tag.appendChild(oddsBtn);
        tag.appendChild(lastBtn);
        tag.appendChild(removeBtn);
        
        wrapper.appendChild(tag);
        
        // Add weight display/input
        const weightContainer = document.createElement('div');
        weightContainer.className = 'weight-container';
        
        const weightLabel = document.createElement('span');
        weightLabel.className = 'weight-label';
        weightLabel.textContent = `Weight: ${nameObj.weight}`;
        weightLabel.title = 'Click to edit weight';
        
        const weightInput = document.createElement('input');
        weightInput.type = 'number';
        weightInput.className = 'weight-input';
        weightInput.value = nameObj.weight;
        weightInput.min = '1';
        weightInput.max = '100';
        weightInput.style.display = 'none';
        
        if (isLocked) {
            weightLabel.style.opacity = '0.5';
            weightLabel.style.cursor = 'not-allowed';
        } else {
            weightLabel.style.cursor = 'pointer';
            weightLabel.addEventListener('click', () => {
                weightLabel.style.display = 'none';
                weightInput.style.display = 'inline-block';
                weightInput.focus();
                weightInput.select();
            });
            
            weightInput.addEventListener('blur', () => {
                updateWeight(nameObj, weightInput.value);
            });
            
            weightInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    weightInput.blur();
                }
            });
        }
        
        weightContainer.appendChild(weightLabel);
        weightContainer.appendChild(weightInput);
        wrapper.appendChild(weightContainer);
        
        // Add labels below the tag
        const labelsContainer = document.createElement('div');
        labelsContainer.className = 'name-tag-labels';
        
        if (nameObj.hasOddsForFirst) {
            const oddsLabel = document.createElement('div');
            oddsLabel.className = 'odds-first-label';
            oddsLabel.textContent = 'odds for first';
            labelsContainer.appendChild(oddsLabel);
        }
        
        if (nameObj.isLast) {
            const lastPickLabel = document.createElement('div');
            lastPickLabel.className = 'last-pick-label';
            lastPickLabel.textContent = 'last pick';
            labelsContainer.appendChild(lastPickLabel);
        }
        
        if (labelsContainer.children.length > 0) {
            wrapper.appendChild(labelsContainer);
        }
        
        nameList.appendChild(wrapper);
    });
}

function updateRandomizeButton() {
    randomizeButton.disabled = names.length < 2 || isLocked;
    clearButton.disabled = isLocked;
    if (isLocked) {
        randomizeButton.title = 'Draft order is locked and cannot be modified.';
        clearButton.title = 'Draft order is locked and cannot be modified.';
    } else {
        randomizeButton.title = '';
        clearButton.title = '';
    }
    updateResetButtonVisibility();
}

function updateResetButtonVisibility() {
    // Show reset button only when locked (opened from share link)
    resetSection.style.display = isLocked ? 'block' : 'none';
}

function addShareButtonToDraftOrder() {
    // Remove any existing share button from draft order
    const existingShareWrapper = draftOrder.querySelector('.share-button-wrapper');
    if (existingShareWrapper) {
        existingShareWrapper.remove();
    }
    
    // Create share button wrapper
    const shareWrapper = document.createElement('div');
    shareWrapper.className = 'share-button-wrapper';
    shareWrapper.style.marginTop = '30px';
    shareWrapper.style.textAlign = 'center';
    
    // Create new share button
    const shareButton = document.createElement('button');
    shareButton.className = 'share-button share-button-inline';
    shareButton.textContent = '🔗 Share draft order with friends';
    shareButton.addEventListener('click', copyShareLink);
    
    shareWrapper.appendChild(shareButton);
    draftOrder.appendChild(shareWrapper);
}

function randomizeOrder() {
    if (names.length < 2) {
        return;
    }
    
    // Remove share button from draft order during randomization
    const existingShareWrapper = draftOrder.querySelector('.share-button-wrapper');
    if (existingShareWrapper) {
        existingShareWrapper.remove();
    }
    
    // Disable all buttons and input during randomization
    randomizeButton.disabled = true;
    randomizeButton.textContent = 'Randomizing...';
    addButton.disabled = true;
    clearButton.disabled = true;
    nameInput.disabled = true;
    
    // Separate names into odds for first, regular, and last picks (keep full objects for weights)
    const oddsForFirst = names.filter(n => !n.isLast && n.hasOddsForFirst);
    const regularNames = names.filter(n => !n.isLast && !n.hasOddsForFirst);
    const lastPicks = names.filter(n => n.isLast);
    
    // Weighted random selection function
    function weightedRandomSelect(nameArray) {
        if (nameArray.length === 0) return null;
        if (nameArray.length === 1) return nameArray[0];
        
        // Calculate total weight
        const totalWeight = nameArray.reduce((sum, n) => sum + n.weight, 0);
        
        // Generate random number between 0 and totalWeight
        let random = Math.random() * totalWeight;
        
        // Find which name this random number corresponds to
        for (let i = 0; i < nameArray.length; i++) {
            random -= nameArray[i].weight;
            if (random <= 0) {
                return nameArray[i];
            }
        }
        
        // Fallback (shouldn't happen)
        return nameArray[nameArray.length - 1];
    }
    
    // Select first pick: weighted random selection from names with odds for first (if any)
    let firstPick = null;
    
    if (oddsForFirst.length > 0) {
        // Weighted random selection from odds for first
        firstPick = weightedRandomSelect(oddsForFirst);
    } else {
        // No names with odds for first, so weighted random selection from regular names
        if (regularNames.length > 0) {
            firstPick = weightedRandomSelect(regularNames);
        } else {
            // Only last picks available (shouldn't happen, but handle it)
            firstPick = weightedRandomSelect(lastPicks);
        }
    }
    
    // Get remaining names after first pick is selected
    const remainingOddsForFirstAfterFirst = oddsForFirst.filter(n => n !== firstPick);
    const remainingRegularAfterFirst = regularNames.filter(n => n !== firstPick);
    const remainingLastAfterFirst = lastPicks.filter(n => n !== firstPick);
    
    // Sort remaining odds for first names by weight (descending), then shuffle names with same weight
    const shuffledOddsForFirst = [];
    const remainingOdds = [...remainingOddsForFirstAfterFirst];
    // Sort by weight descending
    remainingOdds.sort((a, b) => b.weight - a.weight);
    
    // Group by weight and shuffle within each weight group
    let currentWeight = null;
    let currentGroup = [];
    for (const nameObj of remainingOdds) {
        if (currentWeight === null || nameObj.weight === currentWeight) {
            currentWeight = nameObj.weight;
            currentGroup.push(nameObj);
        } else {
            // Shuffle current group and add to result
            for (let i = currentGroup.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [currentGroup[i], currentGroup[j]] = [currentGroup[j], currentGroup[i]];
            }
            shuffledOddsForFirst.push(...currentGroup.map(n => n.name));
            // Start new group
            currentWeight = nameObj.weight;
            currentGroup = [nameObj];
        }
    }
    // Handle last group
    if (currentGroup.length > 0) {
        for (let i = currentGroup.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [currentGroup[i], currentGroup[j]] = [currentGroup[j], currentGroup[i]];
        }
        shuffledOddsForFirst.push(...currentGroup.map(n => n.name));
    }
    
    // Sort regular names by weight (descending), then shuffle names with same weight
    const shuffledRegular = [];
    const remainingRegular = [...remainingRegularAfterFirst];
    // Sort by weight descending
    remainingRegular.sort((a, b) => b.weight - a.weight);
    
    // Group by weight and shuffle within each weight group
    currentWeight = null;
    currentGroup = [];
    for (const nameObj of remainingRegular) {
        if (currentWeight === null || nameObj.weight === currentWeight) {
            currentWeight = nameObj.weight;
            currentGroup.push(nameObj);
        } else {
            // Shuffle current group and add to result
            for (let i = currentGroup.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [currentGroup[i], currentGroup[j]] = [currentGroup[j], currentGroup[i]];
            }
            shuffledRegular.push(...currentGroup.map(n => n.name));
            // Start new group
            currentWeight = nameObj.weight;
            currentGroup = [nameObj];
        }
    }
    // Handle last group
    if (currentGroup.length > 0) {
        for (let i = currentGroup.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [currentGroup[i], currentGroup[j]] = [currentGroup[j], currentGroup[i]];
        }
        shuffledRegular.push(...currentGroup.map(n => n.name));
    }
    
    // Sort last picks by weight (descending), then shuffle names with same weight
    const shuffledLastPicks = [];
    const remainingLast = [...remainingLastAfterFirst];
    // Sort by weight descending
    remainingLast.sort((a, b) => b.weight - a.weight);
    
    // Group by weight and shuffle within each weight group
    currentWeight = null;
    currentGroup = [];
    for (const nameObj of remainingLast) {
        if (currentWeight === null || nameObj.weight === currentWeight) {
            currentWeight = nameObj.weight;
            currentGroup.push(nameObj);
        } else {
            // Shuffle current group and add to result
            for (let i = currentGroup.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [currentGroup[i], currentGroup[j]] = [currentGroup[j], currentGroup[i]];
            }
            shuffledLastPicks.push(...currentGroup.map(n => n.name));
            // Start new group
            currentWeight = nameObj.weight;
            currentGroup = [nameObj];
        }
    }
    // Handle last group
    if (currentGroup.length > 0) {
        for (let i = currentGroup.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [currentGroup[i], currentGroup[j]] = [currentGroup[j], currentGroup[i]];
        }
        shuffledLastPicks.push(...currentGroup.map(n => n.name));
    }
    
    // Combine: first pick, then remaining odds for first (weighted shuffled), then regular names (weighted shuffled), then last picks
    // This ensures all odds for first names come before regular names
    const shuffled = [firstPick.name, ...shuffledOddsForFirst, ...shuffledRegular, ...shuffledLastPicks];
    
    currentDraftOrder = shuffled;
    displayDraftOrderAnimated(shuffled);
}

function displayDraftOrder(orderedNames, animated = false) {
    if (orderedNames.length === 0) {
        draftOrder.innerHTML = '<div class="empty-message">No names to display</div>';
        return;
    }
    
    draftOrder.innerHTML = `<h2>Draft Order</h2><ol class="order-list"></ol>`;
    const orderList = draftOrder.querySelector('.order-list');
    
    if (animated) {
        // Animated reveal will be handled by displayDraftOrderAnimated
        return;
    }
    
    orderedNames.forEach((name, index) => {
        const item = document.createElement('li');
        item.className = 'order-item';
        item.textContent = name;
        item.style.animationDelay = `${index * 0.1}s`;
        orderList.appendChild(item);
    });
}

// Dramatic animated reveal of draft order
function displayDraftOrderAnimated(orderedNames) {
    if (orderedNames.length === 0) {
        draftOrder.innerHTML = '<div class="empty-message">No names to display</div>';
        return;
    }
    
    // Hide fast forward button initially (will show after 3 picks are revealed)
    fastForwardButton.style.display = 'none';
    
    draftOrder.innerHTML = `<h2>Draft Order</h2><ol class="order-list"></ol>`;
    const orderList = draftOrder.querySelector('.order-list');
    
    // Clear any existing items
    orderList.innerHTML = '';
    
    // Get music duration for timing reveals
    const getMusicDuration = () => {
        if (draftMusic && draftMusic.duration && !isNaN(draftMusic.duration)) {
            return draftMusic.duration * 1000; // Convert to milliseconds
        }
        return 3000; // Default to 3 seconds if duration not available
    };
    
    // Ensure music metadata is loaded
    const ensureMusicLoaded = (callback) => {
        if (draftMusic) {
            if (draftMusic.readyState >= 2) {
                // Metadata is loaded
                callback();
            } else {
                // Wait for metadata to load
                const handleLoaded = () => {
                    callback();
                    draftMusic.removeEventListener('loadedmetadata', handleLoaded);
                };
                draftMusic.addEventListener('loadedmetadata', handleLoaded);
                draftMusic.load();
            }
        } else {
            callback();
        }
    };
    
    // Create placeholder items that will be revealed
    orderedNames.forEach((name, index) => {
        const placeholder = document.createElement('li');
        placeholder.className = 'order-item order-item-hidden';
        placeholder.textContent = '?';
        placeholder.dataset.name = name;
        placeholder.dataset.index = index;
        orderList.appendChild(placeholder);
    });
    
    // Reveal names one by one with delays based on music duration
    ensureMusicLoaded(() => {
        const musicDuration = getMusicDuration();
        
        // Clear any existing timeouts
        animationTimeouts = [];
        
        orderedNames.forEach((name, index) => {
            const timeout = setTimeout(() => {
            const placeholder = orderList.querySelector(`[data-index="${index}"]`);
            if (placeholder) {
                placeholder.textContent = name;
                placeholder.classList.remove('order-item-hidden');
                placeholder.classList.add('order-item-reveal');
                
                // Show fast forward button after 3 picks have been revealed
                if (index === 2) {
                    fastForwardButton.style.display = 'block';
                }
                
                // Play music when name is revealed
                if (draftMusic) {
                    draftMusic.currentTime = 0; // Start from beginning
                    draftMusic.volume = 0.7; // Set volume to 70%
                    
                    // Get music duration and play
                    const playMusic = () => {
                        draftMusic.play().catch(error => {
                            // Handle autoplay restrictions or missing file
                            console.log('Audio play failed (this is normal if music file is not added):', error);
                        });
                        
                        // Stop music when it ends naturally
                        const handleEnded = () => {
                            if (draftMusic) {
                                draftMusic.pause();
                                draftMusic.currentTime = 0;
                                draftMusic.removeEventListener('ended', handleEnded);
                            }
                        };
                        
                        draftMusic.addEventListener('ended', handleEnded);
                    };
                    
                    // Wait for metadata to load if needed
                    if (draftMusic.readyState >= 2) {
                        // Metadata is loaded, we can get duration
                        playMusic();
                    } else {
                        // Wait for metadata to load
                        draftMusic.addEventListener('loadedmetadata', () => {
                            playMusic();
                        }, { once: true });
                        // Trigger load if not already loading
                        draftMusic.load();
                    }
                }
                
                // Re-enable buttons and show reset button/share button after last reveal
                if (index === orderedNames.length - 1) {
                    const finalTimeout = setTimeout(() => {
                        randomizeButton.disabled = names.length < 2 || isLocked;
                        randomizeButton.textContent = 'Randomize Draft Order';
                        
                        // Re-enable input and buttons (unless locked)
                        if (!isLocked) {
                            addButton.disabled = false;
                            clearButton.disabled = false;
                            nameInput.disabled = false;
                        }
                        
                        // Hide fast forward button when animations complete
                        fastForwardButton.style.display = 'none';
                        
                        // Show reset button if locked (share link page)
                        if (isLocked) {
                            updateResetButtonVisibility();
                        } else {
                            // Add share button to bottom of draft order (only if not locked)
                            addShareButtonToDraftOrder();
                        }
                    }, 500);
                    animationTimeouts.push(finalTimeout);
                }
            }
        }, index * musicDuration); // Delay based on music duration
            animationTimeouts.push(timeout);
        });
    });
}

function clearAll() {
    if (isLocked) {
        alert('This draft order is locked and cannot be modified.');
        return;
    }
    
    if (names.length > 0 && !confirm('Are you sure you want to clear all names?')) {
        return;
    }
    
    names = [];
    currentDraftOrder = [];
    nameInput.value = '';
    updateNameList();
    updateRandomizeButton();
    draftOrder.innerHTML = '';
    fastForwardButton.style.display = 'none'; // Hide fast forward button
    // Share button will be removed when draftOrder.innerHTML is cleared
}

// Reset to create own order (only available when locked from share link)
function resetToCreateOwn() {
    if (confirm('Reset and create your own draft order? This will clear the current locked order.')) {
        // Stop intro music if playing
        if (introMusic) {
            introMusic.pause();
            introMusic.currentTime = 0;
        }
        
        // Unlock and clear everything
        isLocked = false;
        names = [];
        currentDraftOrder = [];
        nameInput.value = '';
        draftOrder.innerHTML = '';
        
        // Show all sections again
        showAllSections();
        revealSection.style.display = 'none';
        revealButton.style.display = 'block'; // Reset button visibility
        fastForwardButton.style.display = 'none'; // Hide fast forward button
        countdownDisplay.style.display = 'none'; // Reset countdown visibility
        
        // Update UI
        updateNameList();
        updateRandomizeButton();
    }
}

// Show/hide sections based on share link state
function hideAllSections() {
    document.querySelector('.input-section').style.display = 'none';
    document.querySelector('.actions').style.display = 'none';
    document.querySelector('.share-section').style.display = 'none';
    resetSection.style.display = 'none';
    draftOrder.style.display = 'none';
}

function showAllSections() {
    document.querySelector('.input-section').style.display = 'block';
    document.querySelector('.actions').style.display = 'flex';
    document.querySelector('.share-section').style.display = 'none'; // Keep hidden, button is in draft order
    draftOrder.style.display = 'block';
}

// Skip animations and immediately show draft order
function skipAnimations() {
    // Stop all music
    if (introMusic) {
        introMusic.pause();
        introMusic.currentTime = 0;
    }
    if (draftMusic) {
        draftMusic.pause();
        draftMusic.currentTime = 0;
    }
    
    // Clear countdown interval
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    
    // Clear all animation timeouts
    animationTimeouts.forEach(timeout => clearTimeout(timeout));
    animationTimeouts = [];
    
    // Hide countdown, reveal section, and fast forward button
    countdownDisplay.style.display = 'none';
    revealSection.style.display = 'none';
    fastForwardButton.style.display = 'none';
    
    // Show the draft order immediately
    draftOrder.style.display = 'block';
    
    // Display the full draft order without animation
    if (currentDraftOrder.length > 0 && 
        currentDraftOrder.length === names.length &&
        currentDraftOrder.every(name => names.some(n => n.name === name))) {
        displayDraftOrder(currentDraftOrder, false);
    }
    
    // Re-enable buttons
    randomizeButton.disabled = names.length < 2 || isLocked;
    randomizeButton.textContent = 'Randomize Draft Order';
    
    // Re-enable input and buttons (unless locked)
    if (!isLocked) {
        addButton.disabled = false;
        clearButton.disabled = false;
        nameInput.disabled = false;
    }
    
    // Show reset button if locked (share link page), otherwise show share button
    if (isLocked) {
        updateResetButtonVisibility();
    } else {
        // Add share button to bottom of draft order (only if not locked)
        addShareButtonToDraftOrder();
    }
}

// Reveal the draft order when reveal button is clicked
function revealDraftOrder() {
    // Hide reveal button and reset button
    revealButton.style.display = 'none';
    resetSection.style.display = 'none'; // Hide reset button until reveal completes
    
    // Hide fast forward button initially (will show after 3 picks are revealed)
    fastForwardButton.style.display = 'none';
    
    // Show countdown display
    countdownDisplay.style.display = 'block';
    
    // Start playing intro music
    if (introMusic) {
        introMusic.currentTime = 0;
        introMusic.volume = 0.7;
        introMusic.play().catch(error => {
            console.log('Intro music play failed during countdown:', error);
        });
    }
    
    // Countdown from 3
    let countdown = 3;
    countdownDisplay.textContent = countdown;
    
    countdownInterval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
            countdownDisplay.textContent = countdown;
        } else {
            clearInterval(countdownInterval);
            countdownInterval = null;
            
            // Stop intro music
            if (introMusic) {
                introMusic.pause();
                introMusic.currentTime = 0;
            }
            
            // Hide countdown and fast forward button
            countdownDisplay.style.display = 'none';
            fastForwardButton.style.display = 'none';
            revealSection.style.display = 'none';
            
            // Show the draft order
            draftOrder.style.display = 'block';
            
            // Display the locked draft order with animated reveal (same as normal page)
            if (currentDraftOrder.length > 0 && 
                currentDraftOrder.length === names.length &&
                currentDraftOrder.every(name => names.some(n => n.name === name))) {
                displayDraftOrderAnimated(currentDraftOrder);
            }
            
            // Show reset button after reveal completes
            // The reset button will be shown by updateResetButtonVisibility which is called
            // after the animated reveal completes
        }
    }, 1000);
}

// Copy shareable link to clipboard
function copyShareLink() {
    const data = {
        names: names,
        draftOrder: currentDraftOrder
    };
    
    if (names.length === 0) {
        alert('Please add some names before sharing.');
        return;
    }
    
    // Encode data in URL
    const encoded = encodeURIComponent(JSON.stringify(data));
    const shareUrl = `${window.location.origin}${window.location.pathname}?data=${encoded}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareUrl).then(() => {
        // Update original button if visible
        const originalText = shareLinkButton.textContent;
        shareLinkButton.textContent = '✓ Link Copied!';
        setTimeout(() => {
            shareLinkButton.textContent = originalText;
        }, 2000);
        
        // Update inline button if it exists
        const inlineButton = draftOrder.querySelector('.share-button-inline');
        if (inlineButton) {
            const inlineOriginalText = inlineButton.textContent;
            inlineButton.textContent = '✓ Link Copied!';
            setTimeout(() => {
                inlineButton.textContent = inlineOriginalText;
            }, 2000);
        }
    }).catch(() => {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            const originalText = shareLinkButton.textContent;
            shareLinkButton.textContent = '✓ Link Copied!';
            setTimeout(() => {
                shareLinkButton.textContent = originalText;
            }, 2000);
            
            // Update inline button if it exists
            const inlineButton = draftOrder.querySelector('.share-button-inline');
            if (inlineButton) {
                const inlineOriginalText = inlineButton.textContent;
                inlineButton.textContent = '✓ Link Copied!';
                setTimeout(() => {
                    inlineButton.textContent = inlineOriginalText;
                }, 2000);
            }
        } catch (err) {
            alert('Could not copy link. Here it is:\n\n' + shareUrl);
        }
        document.body.removeChild(textarea);
    });
}

// Load data from URL parameters
// Returns true if data was loaded from URL, false otherwise
function loadFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const dataParam = urlParams.get('data');
    
    if (dataParam) {
        try {
            const data = JSON.parse(decodeURIComponent(dataParam));
            
            if (data.names && Array.isArray(data.names)) {
                // Convert names to object format if needed (for backward compatibility)
                names = data.names.map(name => {
                    if (typeof name === 'string') {
                        return { name: name, isLast: false, hasOddsForFirst: false, weight: 5, hasCustomWeight: false };
                    }
                    // Already an object, ensure it has isLast, hasOddsForFirst, and weight properties
                    // Explicitly check if isLast exists and is true, otherwise default to false
                    const isLast = (name && typeof name === 'object' && name.hasOwnProperty('isLast')) 
                        ? Boolean(name.isLast) 
                        : false;
                    const hasOddsForFirst = (name && typeof name === 'object' && name.hasOwnProperty('hasOddsForFirst')) 
                        ? Boolean(name.hasOddsForFirst) 
                        : false;
                    const weight = (name && typeof name === 'object' && typeof name.weight === 'number') 
                        ? name.weight 
                        : (hasOddsForFirst ? 10 : (isLast ? 1 : 5));
                    const hasCustomWeight = (name && typeof name === 'object' && name.hasOwnProperty('hasCustomWeight')) 
                        ? Boolean(name.hasCustomWeight) 
                        : false;
                    return { name: name.name || name, isLast: isLast, hasOddsForFirst: hasOddsForFirst, weight: weight, hasCustomWeight: hasCustomWeight };
                });
                currentDraftOrder = data.draftOrder || [];
                
                // Lock the order when loaded from share link
                isLocked = true;
                
                // Hide all sections and show only reveal button
                hideAllSections();
                revealSection.style.display = 'block';
                revealButton.style.display = 'block'; // Ensure button is visible
                fastForwardButton.style.display = 'none'; // Hide fast forward button initially
                countdownDisplay.style.display = 'none'; // Ensure countdown is hidden
                resetSection.style.display = 'none'; // Hide reset button until reveal completes
                
                // Don't display order yet - wait for reveal button click
                draftOrder.innerHTML = '';
                
                // Play intro music in a loop
                if (introMusic) {
                    console.log('Intro music element found, readyState:', introMusic.readyState);
                    let musicStarted = false;
                    
                    // Function to start music on user interaction
                    const startMusicOnInteraction = () => {
                        if (musicStarted) return;
                        console.log('User interaction detected, starting intro music');
                        introMusic.currentTime = 0;
                        introMusic.volume = 0.7;
                        introMusic.play().then(() => {
                            console.log('Intro music started on user interaction');
                            musicStarted = true;
                        }).catch(err => {
                            console.log('Intro music play failed:', err);
                        });
                    };
                    
                    // Set up interaction listeners immediately (for when autoplay is blocked)
                    document.addEventListener('click', startMusicOnInteraction, { once: true });
                    document.addEventListener('touchstart', startMusicOnInteraction, { once: true });
                    
                    // Also try to play immediately (in case autoplay works)
                    const playIntroMusic = () => {
                        if (musicStarted) return;
                        
                        console.log('Attempting to play intro music automatically');
                        introMusic.currentTime = 0;
                        introMusic.volume = 0.7;
                        introMusic.play().then(() => {
                            console.log('Intro music playing successfully (autoplay worked)');
                            musicStarted = true;
                            // Remove the interaction listeners since we don't need them
                            document.removeEventListener('click', startMusicOnInteraction);
                            document.removeEventListener('touchstart', startMusicOnInteraction);
                        }).catch(error => {
                            console.log('Intro music autoplay blocked, will play on first user interaction:', error);
                            // Keep the interaction listeners we already set up
                        });
                    };
                    
                    // Wait for audio to be ready
                    if (introMusic.readyState >= 2) {
                        // Audio is ready, try to play
                        playIntroMusic();
                    } else {
                        // Wait for audio to load
                        console.log('Waiting for intro music to load...');
                        introMusic.addEventListener('canplaythrough', () => {
                            console.log('Intro music loaded, readyState:', introMusic.readyState);
                            playIntroMusic();
                        }, { once: true });
                        introMusic.addEventListener('error', (e) => {
                            console.error('Intro music loading error:', e);
                        });
                        introMusic.load();
                    }
                } else {
                    console.error('Intro music element not found!');
                }
                
                // Clean URL (remove data parameter)
                const cleanUrl = window.location.origin + window.location.pathname;
                window.history.replaceState({}, document.title, cleanUrl);
                
                return true; // Indicate that data was loaded from URL
            }
        } catch (error) {
            console.error('Error loading from URL:', error);
        }
    }
    return false; // No data loaded from URL
}


