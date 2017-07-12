# What is this?
This is a random nodejs + express exercise for myself.
It is just a simple web page for query the HK KMB Bus Arrival Time.

# Run the app
1. First clone this repo

        # git clone https://github.com/shunwatai/kmb-bus-query

2. To run this app, please install the required nodejs module by following commands:
    
        # cd kmb-bus-arrival-query
        # npm install express request body-parser

3. run it with a port number, I use port 3000 here

        # node kmb.js 3000
        
4. open a web browser and go to http://serverIP:3000

5. input bus number --> select direction --> select bus stop

6. Wait for few seconds and the time of next bus arrival should be displayed

# Acknowledgement
Special thanks to [nubotz](https://github.com/nubotz), this little exercise is referenced from his [telegram bot](https://github.com/nubotz/hk9busbot).

