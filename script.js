let names = []; // Array of objects: {name: string, isLast: boolean}
let currentDraftOrder = [];
let isLocked = false; // Locked when loaded from share link

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
    
    names.push({ name: name, isLast: false });
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
            }
        });
    }
    
    // Toggle the current name's last pick status
    nameObj.isLast = !nameObj.isLast;
    updateNameList();
    // Clear draft order if last pick status changes
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
        // Ensure isLast is always a boolean
        if (typeof nameObj.isLast !== 'boolean') {
            nameObj.isLast = false;
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
        
        tag.appendChild(span);
        tag.appendChild(lastBtn);
        tag.appendChild(removeBtn);
        
        wrapper.appendChild(tag);
        
        // Add "last pick" text below the tag if marked as last pick
        if (nameObj.isLast) {
            const lastPickLabel = document.createElement('div');
            lastPickLabel.className = 'last-pick-label';
            lastPickLabel.textContent = 'last pick';
            wrapper.appendChild(lastPickLabel);
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
    
    // Separate names into regular and last picks
    const regularNames = names.filter(n => !n.isLast).map(n => n.name);
    const lastPicks = names.filter(n => n.isLast).map(n => n.name);
    
    // Fisher-Yates shuffle algorithm for regular names
    for (let i = regularNames.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [regularNames[i], regularNames[j]] = [regularNames[j], regularNames[i]];
    }
    
    // Shuffle last picks as well (in case multiple are marked as last)
    for (let i = lastPicks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [lastPicks[i], lastPicks[j]] = [lastPicks[j], lastPicks[i]];
    }
    
    // Combine: regular names first, then last picks at the end
    const shuffled = [...regularNames, ...lastPicks];
    
    currentDraftOrder = shuffled;
    displayDraftOrderAnimated(shuffled);
}

function displayDraftOrder(orderedNames, animated = false) {
    if (orderedNames.length === 0) {
        draftOrder.innerHTML = '<div class="empty-message">No names to display</div>';
        return;
    }
    
    const lockNotice = isLocked ? '<div class="lock-notice">🔒 Draft order is locked (loaded from share link)</div>' : '';
    draftOrder.innerHTML = `<h2>Draft Order</h2>${lockNotice}<ol class="order-list"></ol>`;
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
    
    const lockNotice = isLocked ? '<div class="lock-notice">🔒 Draft order is locked (loaded from share link)</div>' : '';
    draftOrder.innerHTML = `<h2>Draft Order</h2>${lockNotice}<ol class="order-list"></ol>`;
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
        
        orderedNames.forEach((name, index) => {
            setTimeout(() => {
            const placeholder = orderList.querySelector(`[data-index="${index}"]`);
            if (placeholder) {
                placeholder.textContent = name;
                placeholder.classList.remove('order-item-hidden');
                placeholder.classList.add('order-item-reveal');
                
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
                    setTimeout(() => {
                        randomizeButton.disabled = names.length < 2 || isLocked;
                        randomizeButton.textContent = 'Randomize Draft Order';
                        
                        // Re-enable input and buttons (unless locked)
                        if (!isLocked) {
                            addButton.disabled = false;
                            clearButton.disabled = false;
                            nameInput.disabled = false;
                        }
                        
                        // Show reset button if locked (share link page)
                        if (isLocked) {
                            updateResetButtonVisibility();
                        } else {
                            // Add share button to bottom of draft order (only if not locked)
                            addShareButtonToDraftOrder();
                        }
                    }, 500);
                }
            }
        }, index * musicDuration); // Delay based on music duration
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

// Reveal the draft order when reveal button is clicked
function revealDraftOrder() {
    // Hide reveal button and reset button
    revealButton.style.display = 'none';
    resetSection.style.display = 'none'; // Hide reset button until reveal completes
    
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
    
    const countdownInterval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
            countdownDisplay.textContent = countdown;
        } else {
            clearInterval(countdownInterval);
            
            // Stop intro music
            if (introMusic) {
                introMusic.pause();
                introMusic.currentTime = 0;
            }
            
            // Hide countdown and reveal section
            countdownDisplay.style.display = 'none';
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
                        return { name: name, isLast: false };
                    }
                    // Already an object, ensure it has isLast property
                    // Explicitly check if isLast exists and is true, otherwise default to false
                    const isLast = (name && typeof name === 'object' && name.hasOwnProperty('isLast')) 
                        ? Boolean(name.isLast) 
                        : false;
                    return { name: name.name || name, isLast: isLast };
                });
                currentDraftOrder = data.draftOrder || [];
                
                // Lock the order when loaded from share link
                isLocked = true;
                
                // Hide all sections and show only reveal button
                hideAllSections();
                revealSection.style.display = 'block';
                revealButton.style.display = 'block'; // Ensure button is visible
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


