const fs = require('fs'); //file module
let puppet=require('puppeteer'); //for automation
const PDFDocument = require("pdfkit"); //for using pdf 
let xlsx = require("xlsx"); //for using excel
let flag=true;
let inp=process.argv.slice(2);  //inputs from user

if(inp.length==0){  //to check if no arguments are passed
flag=false;
console.log("Please enter the variables")
}


if(inp.length==1){ //if only one argument is passed then the user is allowed to ask the query for the commands to be used
    flag=false;
    if(inp[0]=='-q'){  //using q one can enter it
        console.log("This project is used to get details about the car\n Here you need to pass 5 variables\n1.Start Range \n2.End Range (Should be under 1Cr)  \n3.Type of car (suv,hatchback,sedan,muv) \n4.Sortlist on the basis of(avg,engine,price) \n5.Format of file (pdf,xls,json)");
    }
    else{
        console.log("Please select correct input")
    }
}
//the checking block starts
if(inp.length==5){
    
    if(inp[0]<2){
        flag=false;
        console.log("The start range should be greater than 2")
    }
    if(inp[1]>=100){
        flag=false;
        console.log("The end of the range should be less than 100")
    }
    if(inp[2]!='suv'&&inp[2]!='hatchback'&&inp[2]!='sedan'&&inp[2]!='muv'){
        flag=false;
        console.log("Please select a valid car type from the given list")
    }
    if(inp[3]!='avg'&&inp[3]!='engine'&&inp[3]!='price'){
        flag=false;
        console.log("Please select a valid car functionality  from the given list")
    }
    if(inp[4]!='pdf'&&inp[4]!='xls'&&inp[4]!='json'){
        flag=false;
        console.log("Please select a valid format type")
    }
}
//the checking block ends

if(flag){  // if everything is correct then go ahead

(async function fn(){
    
    try{
        let browserStart=puppet.launch({
            headless:false,
            // slowMo:1000,
        timeout: 300000,
            defaultViewport:null,
            args:["--start-maximized","--disable-notifications"]
        
        })
 browser=await browserStart;
 let page=await browser.newPage();
 let cpage=page;
 await cpage.goto(`https://www.cardekho.com/new-${inp[2]}+cars+${inp[0]}-lakh-${inp[1]}-lakh`);  //link for the website opens through the query



 await cpage.waitFor(3000);
 let count = await cpage.$("#model-highlight");  //gives count of the elements to scraped

if(count==null){
    count=await cpage.$("span[class='chips']");  //this element gives the count if the above element is not present on the website
}

 let loopCount= await cpage.evaluate(function cb(ele) {  //gives the count
    return ele.textContent;
}, count);
  
   let loop=10;
   if(parseInt(loopCount)){
       loop=parseInt(loopCount)
   }
   else{
 loop=loopCount.split(" ")[2];  //this count is calculated
   }

if(loop>=10){
    let Loopcount=Math.ceil(loop/10);  //no of time the loop works
    console.log(Loopcount);
    await cpage.waitFor(2000);
     for(let i=0;i<Loopcount;i++){ //this is loop for scrolling till the bottom 
      await scrollToBottom(cpage)
      
        console.log("loaded the spinner");
    }
}
        
let smList = await cpage.$$(".gsc_col-sm-7.gsc_col-xs-8.gsc_col-md-8.listView.holder");
let cars=[];
        
        
  for(let i=0;i<smList.length;i++){  //this whole for loop produces the data for the cars in a well ordered manner
let val= await cpage.evaluate(function cb(ele) {
    return ele.textContent;
}
    , smList[i]);
      
      
   let idx=val.indexOf("Price");
   let name=val.slice(0,idx);
 

   idx=val.indexOf("Rs");
   idx2=val.indexOf("Lakh");
   let price=val.slice(idx,idx2+4);
  
   let milage=undefined;
   if(val.indexOf("kmpl")!=-1){
       let index=val.indexOf("New Delhi");
       milage=val.slice(index+9,val.indexOf("kmpl"))+"kmpl";
   }
   let engine=undefined;
  
   if(milage!=undefined){
       if(val.indexOf("cc")!=-1){
        engine=val.slice(val.indexOf("kmpl")+4,val.indexOf("cc")+2);
        }
    }
    if(milage==undefined){
        let index=val.indexOf("New Delhi");
        engine=val.slice(index+9,val.indexOf("cc")+2)+" cc";
    }

    if(milage!=undefined&&engine!=undefined){
        if(inp[3]=='price'){
        let carobj={name:name,price:price,engine:engine,mileage:milage,t:parseInt(price.split(".")[1]),o:parseInt(price.split(".")[2].split("-")[0])};
        cars.push(carobj);
        }
    }
    if(milage!=undefined&&engine!=undefined){
     if(inp[3]=='avg'){
     let carobj={name:name,price:price,engine:engine,mileage:milage,t:parseFloat(milage.split(" ")[0])};
     cars.push(carobj);
     }
 }
 if(milage!=undefined&&engine!=undefined){
     if(inp[3]=='engine'){
     let carobj={name:name,price:price,engine:engine,mileage:milage,t:parseInt(engine.split(" ")[0])};
     cars.push(carobj);
     }
 }
   

}
        
console.log(cars);


function sortIt(a,b){  //this function sort the cars array according to the user
    if(a.t<b.t){
        return a.t-b.t;
    }
   else if(a.t==b.t){
       return a.o-b.o;
    }
}
        
        
cars.sort(sortIt);
console.log(cars);

 
let ansCars=[]
for(let i=0;i<cars.length;i++){
ansCars.push({name:cars[i].name,mileage:cars[i].mileage,engine:cars[i].engine,price:cars[i].price});  //removes the extra variables in the object
}
        
console.table(ansCars);
writeInFile(ansCars,inp[4]);


//uploading the file to the drive
const fileExitst = fs.existsSync(`${inp[0]}lakhs-${inp[1]}lakhs ${inp[2]} cars.${inp[4]}`);
const npage = await browser.newPage();
await npage.goto('https://anonfiles.com', { waitUntil: 'networkidle2' })

await npage.waitForSelector('input[type="file"]')
const input = await npage.$('input[type="file"]')
if (fileExitst) {
    await input.uploadFile(`${inp[0]}lakhs-${inp[1]}lakhs ${inp[2]} cars.${inp[4]}`);
}
await npage.waitForSelector('.copy-url-wrapper.input-group-addon');
await npage.click('.copy-url-wrapper.input-group-addon');


//sending file's link on instagram
const nepage = await browser.newPage();
await nepage.goto('https://www.instagram.com/', { waitUntil: 'networkidle2' })
await nepage.waitForSelector("input[name='username']",{visible:true})
await nepage.type("input[name='username']","narangnitik15@gmail.com");
await nepage.waitForSelector("input[type='password']",{visible:true})
await nepage.type("input[type='password']","rahul123@NN");
await nepage.waitFor(2000);
await nepage.keyboard.press('Enter');
await nepage.waitForSelector(".cmbtv button",{visible:true})
await nepage.click('.cmbtv button');
await nepage.waitForSelector("input[type='text']",{visible:true});
await nepage.type("input[type='text']","pepcoding");
await nepage.waitFor(2000);
await nepage.waitForSelector(".-qQT3",{visible:true});
let data=await nepage.$$(".-qQT3");
await data[0].click();
await nepage.waitFor(3000);
data=await nepage.$$("button");
await data[0].click();
await nepage.waitForSelector("textarea",{visible:true});
await nepage.type("textarea","Hii Pepcoding!! This is sent with automation thanks Jasbir Bhaiya");

await nepage.waitFor(3000);
await nepage.keyboard.press('Enter');

await nepage.keyboard.down('Control');

await nepage.keyboard.press('KeyV');

await nepage.keyboard.up('Control');
await nepage.keyboard.press('Enter');
    }
    catch(err){
        console.log(err);
    }
})();


async function scrollToBottom(page) {//this function is used for scrolling purpose
    const distance = 100; // should be less than or equal to window.innerHeight
    const delay = 700;
    while (await page.evaluate(() => document.scrollingElement.scrollTop + window.innerHeight < document.scrollingElement.scrollHeight)) {
      await page.evaluate((y) => { document.scrollingElement.scrollBy(0, y); }, distance);
      await page.waitFor(delay);
    }
  }
function writeInFile(cars,type){  //this function helps to write in the file
    
    if(type=='json'){
        
        fs.writeFileSync(`${inp[0]}lakhs-${inp[1]}lakhs ${inp[2]} cars.json`,JSON.stringify(cars));
        
    }
    if(type=='xls'){
        console.log("print it");
        excelWriter(`${inp[0]}lakhs-${inp[1]}lakhs ${inp[2]} cars.xlsx`,cars,`${inp[0]}lakhs-${inp[1]}lakhs ${inp[2]} cars`)
    }
    if(type=='pdf'){
        createInvoice(cars,`${inp[0]}lakhs-${inp[1]}lakhs ${inp[2]} cars.pdf`);

    }
}
    
function generateTableRow(doc, y, c1, c2, c3, c4) {
    console.log(y,c1,c2,c3,c4);
    doc
      .fontSize(10)
      .text(c1, 50, y)
      .text(c2, 150, y)
      .text(c3, 280, y, { width: 90, align: "right" })
      .text(c4, 370, y, { width: 90, align: "right" })
      
  }
function generateInvoiceTable(doc, invoice) {
    let invoiceTableTop=50;
    generateTableRow(
        doc,
        50,
        "Name",
        "Price",
        "Mileage", 
       "Engine"
        
      );

    for(let i = 0; i < invoice.length; i++) {
      
      const position = invoiceTableTop + (i + 1) * 30;
      generateTableRow(
        doc,
        position,
        invoice[i].name,
        invoice[i].price,
    invoice[i].mileage, 
    invoice[i].engine
        
      );
    }
  }
function createInvoice(invoice, path) { //function for generating the pdf
    let doc = new PDFDocument({ margin: 50 });
  
  
    generateInvoiceTable(doc, invoice);
   
  
    doc.end();
    doc.pipe(fs.createWriteStream(path));
  }
function excelWriter(filePath, json, sheetName) { // function for excel
    // workbook create
    let newWB = xlsx.utils.book_new();
    // worksheet
    let newWS = xlsx.utils.json_to_sheet(json);
    xlsx.utils.book_append_sheet(newWB, newWS, sheetName);
    // excel file create 
    xlsx.writeFile(newWB, filePath);
}

}


