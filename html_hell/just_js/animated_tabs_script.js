<script>
    // Array of different titles to show as animation
    var titles = ["24m20ck 24d10", "Z4m20ck 24d10", "Z4m20ck R4d10", "Z4mR0ck R4d10", "Z4mR0ck R4di0", "ZamR0ck R4di0", "ZamR0ck R4dio", "ZamRock R4dio","ZamRock Radio","ZamRock Radio.","ZamRock Radio..","ZamRock Radio...","ZamRock Radio..!","ZamRock Radio.!","ZamRock Radio!","ZamRock Radio;!","ZamRock Radio ;!","ZamRock Radio ;P","ZamRock Radio", "ZamRock Radio", "ZamRock R4dio", "ZamR0ck R4dio", "ZamR0ck R4di0", "Z4mR0ck R4di0", "Z4mR0ck R4d10", "Z4m20ck R4d10", "Z4m20ck 24d10", "24m20ck 24d10"];

    // Function to change the title periodically with random interval
    function animateTitle() {
        var currentIndex = 0;

        function changeTitle() {
            document.title = titles[currentIndex];
            currentIndex = (currentIndex + 1) % titles.length;

            var interval = Math.floor(Math.random() * 2000) + 500; // Generate random interval between 500 and 200 milliseconds
            setTimeout(changeTitle, interval); // Call the function again after the random interval
        }

        changeTitle();
    }

    // Call the function when the page loads
        window.onload = animateTitle;
</script>
