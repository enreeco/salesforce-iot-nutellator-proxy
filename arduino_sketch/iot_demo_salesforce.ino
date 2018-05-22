/**
 * Sends temperature sensor value to Web Client
 * Calls a POST endpoint @ server:PORT postEndpoint every 5 seconds (http://10.1.1.107:3000/temperature) 
 * providing temperature value and device id ( {"temperature": XX.XX, "device_id": "0123456789-0"} )
 * @author: Enrico Murru
 * @date: 2018-05-03
 */

#include <SPI.h>
#include <Ethernet.h>
#include<LiquidCrystal.h>

//device ID
String deviceID = "0123456789-0";
//Heroku app IP/domain
char server[] = "10.1.1.107";
//Heroku app port
int PORT = 3000;
//Heroku app notification endpoint's path
String postEndpoint = "/temperature";
//sensor check interval
const int CHECK_DELAY = 5000;

// named constant for the pin the sensor is connected to
const int SENSOR_PIN = A0;

//ethernet mac address
byte mac[] = { 0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED };

// Initialize the Ethernet client library
// with the IP address and port of the server
// that you want to connect to (port 80 is default for HTTP):
EthernetClient client;
//Be careful: https://forum.arduino.cc/index.php?topic=104327.0
//On the Uno, the SPI data lines are connected to the ICSP and digital pins 11-13.
LiquidCrystal lcd(9,8,5,4,3,2); 

boolean setupEthernet(){
  // start the Ethernet connection:
  if (Ethernet.begin(mac) == 0) {
    Serial.println("Failed to configure Ethernet using DHCP");
    return false;
  }
  Serial.print("My IP address: ");
  Serial.println(Ethernet.localIP());
  // give the Ethernet shield a second to initialize:
  delay(1000);
  return true;
}

// this method makes a HTTP connection to the server:
void httpRequest(float temperature) {

  String data = "{\"temperature\" : "+String(temperature)+",\"device_id\" : \""+deviceID+"\"}";

  if (client.connect(server, PORT)) {
    Serial.println("Sending: ");
    Serial.println(data);
    // send the HTTP POST request:
    client.println("POST "+postEndpoint+" HTTP/1.1");
    client.println("Host: "+String(server));
    client.println("User-Agent: arduino-ethernet");
    client.println("Connection: close");
    client.println("Content-Type: application/json");
    client.println("Content-Length: " + String(data.length()));
    client.println();
    client.println(data);
  } else {
    // if you couldn't make a connection:
    Serial.println("connection failed");
  }
}

void setup() {
  Serial.begin(9600);

  lcd.begin(16,2);
  lcd.setCursor(0,1);
  lcd.print("Salesforce IoT");
  if(!setupEthernet()){
    lcd.print("Not Connected");
    return;
  }
  
  
}

void loop() {
  int sensorVal = analogRead(SENSOR_PIN);
  // convert the ADC reading to voltage
  float voltage = (sensorVal / 1024.0) * 5.0;
  // convert the voltage to temperature in degrees C
  // the sensor changes 10 mV per degree
  // the datasheet says there's a 500 mV offset
  // ((voltage - 500 mV) times 100)
  float temperature = (voltage - .5) * 100;
   lcd.setCursor(0,0);
   String msg = "T: "+String(temperature)+" Celsius";
   lcd.print(msg);
   
  if(client.available()){
    while (client.available()) {
      char c = client.read();
      Serial.print(c);
    } 
    return;
  }else{
    Serial.println();
    Serial.println("Connections closed.");
    client.stop();
  }
  
  Serial.println("Temp: " + String(temperature)+" Celsius Deg.");
  
  httpRequest(temperature);
  delay(CHECK_DELAY);
}
