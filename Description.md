# Training app design document
This document describes design elements of the new Training app.

> This is the original brief. How the app is organised today, and the decisions made since
> (for example: plans, teal for controls, Forearms removed as a muscle group), are in
> [Design-navigation.md](Design-navigation.md). Open work is in [TODO.md](TODO.md).

## Sync with laptop
The app must be able to sync data between devices and work on Iphone, Android, mac and windows. A person might want to make more involved configurations on a laptop and then use the app on the phone while working out. The UI might be more advanced in laptop-mode due to screen space and capabilities of the device. A persons data must be eailsy transferable between their devices without a hosted server where data is saved.

## User interface
General guideline is a clean aesthetic with easily navigatable tabs and menus.

### Browse exercises
A library tab where the user can see all exercises, grouped by muscle group. Each exercise will include short written instruction, informatation on what muscles are used, the users history in terms of X-rep-PR (say 1, 2, 6 and 10 rep PRs) how much weight has been lifted with the exercise (total weight for fun, and an indication of how popular this exercise is for this particular user). 

### Browse Workouts
A library where the users saved workouts can be viewed and edited. A workout consists of one or more exercises, one or more sets per exercise with one or more reps per set. Resting in between sets can be congifured so that the user can see a stopwatch on screen in between sets, but it is not a forced input the user has to make.

### Main tab
The landning tab for the app is the screen where the user will select their workout for the day. This interface will feature a 3d-model of a body (body type decided in user settings, default is woman with physique like Ronda Rousey) where different muscles can be selected. The model must be able to spin around for the user to select all different muscles. The selected muscles act as a filter in the users workout-list. The list is found below the 3D-model by scrolling down. The user could also select a workout and the muscles being worked are highlighted in the 3D-model. Depending on how much load is on each muscle relative to the whole workout different muscles are strained more, this will be shown by the highlighted muscle for that workout being a darker red. This way the user can quickly see the type of workout and if that focus is what they want for this specific session.

### Creating workouts
To create a new workout the same 3D-model will be used and the user selects a muscle to get the list of exercises for that specific muscle. The user can then pick any of those exercises to add to the workout. This is simply a way to navigate the different exercises. Another way to generate a workout is by simply highlighting the muscles they want to work out and a sliding bar that goes between Strength and Endurance (which determines reps/set for the exercises) and hit "generate" which will take exercises from those muscle categories and assemble a workout based on those exercises and their data. Based on where the bar is slid the number of reps/sets will be selected for each exercise (An exercise like bench press might go from 5 reps/set and 5 sets, to 12 reps/set and 6 sets, while another exercise like shoulder fly might go from 8 reps/set and 3 sets to 20 reps/ser and 5 sets). The weight for each exercise is assumed either based on a default per exercise or use the users own PR-numbers and estimate what the weight would be for the chosen intensity given reps/set and their rep PR.

### During the workout
When a workout is started we see the list of exercises to do in the order determined by that workout. We see the weights for each exercise as well as reps and sets. The optional rest between sets can be pulled out as a side-bar where the user sees a stop-watch and a start-rest button. The stop-watch will show the active exercises resting period (or if not found it is a simple stop-watch that counts up). When a user is finished with a set they simply tap that set and it will be highlighted green. The User can on the fly increase/remove number or reps or sets in an exercise as well as edit the weight lifted for each set, both in advance and after they have finished. This is how data is tracked per exercise. Exercise order can be altered by drag-n-drop. 