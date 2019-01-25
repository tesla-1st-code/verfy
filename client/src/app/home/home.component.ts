import { Component, OnInit } from '@angular/core';
import { DataService } from '../data.service';

declare var MediaRecorder;

@Component({
  selector: 'verfy-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  mediaRecorder: any;
  isTraining: boolean;
  isVerifying: boolean;

  keyword: string;
  name: string;
  audioChunks: any[];
  trainingData: any[];
  state: string;

  constructor(private dataService: DataService) { }

  ngOnInit() {
    this.isTraining = false;
    this.isVerifying = false;
    this.audioChunks = [];
    this.trainingData = [];

    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      this.mediaRecorder = new MediaRecorder(stream);

      this.mediaRecorder.addEventListener("dataavailable", event => {
        this.audioChunks.push(event.data);
        console.log(event.data);
      });

      this.mediaRecorder.addEventListener("stop", async () => {
        const audioBlob = new Blob(this.audioChunks);
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
       
        audio.play();

        try {
          const arr = await new Response(audioBlob).arrayBuffer();
          const int16Array = new Int8Array(arr);
          
          let data = [];
  
          int16Array.forEach(val => {
            data.push(val);  
          });

          if (this.state === 'training') {
            this.trainingData.push(data);
          }
          else {
            this.login(data);
          }
        }
        catch(error) {

        }
        this.audioChunks = [];
      });
    });
  }

  record(state) {
    if (state === 'training') {
      this.isTraining = true;
    }
    else {
      this.isVerifying = true;
    }
    
    this.state = state;
    this.mediaRecorder.start();
  }

  stop(state) {
    if (state === 'training') {
      this.isTraining = false;
    }
    else {
      this.isVerifying = false;
    }

    this.state = null;
    this.mediaRecorder.stop();
  }

  async login(data) {
    try {
      let response = await this.dataService.save({signal: data}, 'verifications', 'verify').toPromise();
    }
    catch(error) {

    }
  }

  async save() {
    let data = {
      name: this.name,
      keyword: this.keyword,
      audio: this.trainingData
    };

    try {
      let response = await this.dataService.save(data, 'trainings', 'extract').toPromise();
      this.trainingData = [];
      this.name = null;
      this.keyword = null;
    }
    catch(error) {
      console.log(error);
    }
  }
}
