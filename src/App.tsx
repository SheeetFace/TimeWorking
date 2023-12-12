
import React, { useState } from 'react';
import './App.css';
import * as XLSX from 'xlsx';

const getDateFromString = (str:any, hasDate=false, i:number) => {
  const dateRegex = /(\d{1,2}).(\d{1,2}).(\d{4})/;
  const timeRegex = /(\d{1,2}):(\d{2})/;

  console.log(str)
  if(str !== undefined){
    const [time, date] = str.split(' ');

  let result:any = {
    date: new Date(),
    hours: 0,
    minutes: 0
  };

  if (hasDate) {
    const [, day, month, year] = dateRegex.exec(date) || [];
    result.date = new Date(`${year}-${month}-${day}`);
  }

  const [, hours, minutes] = timeRegex.exec(time) || [];
  result.hours = hours === "00" || hours === "0" ? 0 : parseInt(hours);
  result.minutes = minutes === "00" || minutes === "0" ? 0 : parseInt(minutes);

  return result;
  }
 
}

const findKey = (obj: any, searchString: string) => {
  for (let key in obj) {
    if (key.includes(searchString)) {
      return key;
    }
  }
}

const App: React.FC = () => {

  const [status, setStatus] =useState<'IDLE'|'SUCCESS'>('IDLE')


  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files![0];
    const reader = new FileReader();

    reader.onload = (e: ProgressEvent<FileReader>) => {
      const data = e.target!.result;
      const workbook = XLSX.read(data, {type: 'array'});

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const excelData = XLSX.utils.sheet_to_json(sheet, {blankrows: true});

      const updatedData = getWorkingTime(excelData); 
      // console.log(updatedData)
      createNewFile(updatedData)
    }

    reader.readAsArrayBuffer(file);
  };

  const getWorkingTime = (excelData:any) => {

    excelData.forEach((row:any, i:number) => {
      const entryKey:any = findKey(row, '[Вход]');
      const exitKey:any = findKey(row, '[Выход]');
      

      
      if(typeof exitKey !== 'undefined' || typeof entryKey !== 'undefined'){

        const entryTime:any = getDateFromString(row[entryKey],false,i);

        let exitTime:any;
        let duration;
        if (exitKey) {
          const timeFormatRegex = /^\d{2}:\d{2}$/;
          
          if (timeFormatRegex.test(row[exitKey])) {
            exitTime = getDateFromString(row[exitKey], false,i);
            duration = (exitTime.hours * 60 + exitTime.minutes) - (entryTime.hours * 60 + entryTime.minutes);
          } else if (row[exitKey].includes('.')) {
            exitTime = getDateFromString(row[exitKey], true,i);
            duration = (exitTime.hours * 60 + exitTime.minutes + 24 * 60) - (entryTime.hours * 60 + entryTime.minutes);
          } else {
            duration = 0;
          }
        } else {
          duration = 0;
        }
    
        const hours = Math.floor(duration / 60);
        const minutes = duration % 60;
      
        const formattedHours = hours < 10 ? `0${hours}` : hours;  
        const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
            
        const formattedDuration = `${formattedHours}:${formattedMinutes}`;
            
        row["Присутствие"] = formattedDuration;
        row["Всего"] = formattedDuration;
      }
    
    });
    
    return excelData;
  }

    const createNewFile=(updatedData:any)=>{

    const newWorkbook = XLSX.utils.book_new();

    const newWorksheet = XLSX.utils.json_to_sheet(updatedData);

    XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, "ЧАСЫ РАБОТЫ РАБОЧИХ");

    const excelBuffer = XLSX.write(newWorkbook, {type: 'array'}); 

    const blob = new Blob([excelBuffer], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = "отчет.xlsx";
    link.click(); 

    setStatus('SUCCESS')
  }

  if(status==='SUCCESS'){
    setTimeout(()=>{
      setStatus('IDLE')
    },1000)
  }

  return (
    // <div className='App'>
     

    // <div className='App-rules'>
    //   {status ==='IDLE' ? 
    //   <>
    //       <h1>ВАЖНЫЕ ПРАВИЛА ДЛЯ КОРРЕКТНОЙ РАБОТЫ</h1>
    //       <h3>👉🏻1. формат документа должен быть .xlsx</h3>

    //       <h3>👉🏻2. Документ НЕ должен содержать лишних записей выше или ниже, только сама таблица </h3>
    //       <div>
    //         <div className='App-rules-imageBOx'>
    //           <div>
    //             <h4 style={{color:"red", fontSize:'2rem'}}>НЕ ВЕРНО</h4>
    //             <img  src='https://cdn.discordapp.com/attachments/872343092500504628/1133728142620635236/image.png' alt=''></img>
    //           </div>

    //           <div>
    //             <h4 style={{color:"green",fontSize:'2rem'}}>ВЕРНО</h4>
    //             <img src='https://cdn.discordapp.com/attachments/872343092500504628/1133726399694372905/image.png' alt=''></img>
    //           </div>
    //         </div>
    //       </div>
    //       <h3>👉🏻3. ОБЯЗАТЕЛЬНО В НАЗВАНИЯХ ТАБЛИЦЫ С ПРИХОДОМ ДОЛЖНО БЫТЬ КЛЮЧЕВОЕ СЛОВО 👉🏻[Вход]👈🏻, что перед ним или после него не имеет значения. Этого же качается и 👉🏻[Выход]👈🏻  </h3>
    //       <h3>👉🏻4. [Вход] с форматов времени такого типа 25.07.2023 07:32 - НЕ БУДЕТ ПОСЧИТАН, только с таким форматом 07:32 </h3>
    //       <h3>👉🏻5. После загрузки файла, сразу же будет скачен новый файл с названием "отчет.xlsx" 
    //       В  Новом файле вместо названия столбца 24.07.2023 Понедельник[Присутствие] будет просто "Присутствие"
    //       </h3>
    //   </>
    //   :
    //   <div className='success'>
    //     ФАЙЛ СКАЧЕН
    //   </div>
    //   }
    // </div>
    // <h3 style={{color:"white",fontSize:'2rem', textAlign:"center"}}>Итог такой, просто убрать шапку (пункт 2) и должно работать </h3>
    // <div className='App-box'>
    //     <input className='App-box-button' type="file" onChange={handleFileUpload} />
    //   </div>
    // </div>
        <iframe
        
          src="https://games.wavey.group/games/doom2/index.html"
          width="99.5%"
          height="700px"
          allow="autoplay"
        >
        </iframe>
  );
}

export default App;
