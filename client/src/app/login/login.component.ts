import { Component, OnInit } from '@angular/core';
import { DataService } from '../data.service';

declare var MediaRecorder;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  mediaRecorder: any;
  isRecording: boolean;
  audioChunks: any[];
  result: any;

  constructor(private dataService: DataService) { }

  ngOnInit() {
    this.audioChunks = [];
    this.initMedia();
  }

  initMedia(): void {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      this.mediaRecorder = new MediaRecorder(stream);

      this.mediaRecorder.addEventListener("dataavailable", event => {
        this.audioChunks.push(event.data);
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

          this.login(data);
          
        }
        catch(error) {
          console.log(error);
        }
        this.audioChunks = [];
      });
    });
  }

  start(): void {
    this.isRecording = true;
    this.mediaRecorder.start();
  }

  stop(): void {
    this.isRecording = false;
    this.mediaRecorder.stop();
  }

  async login(data) {
    try {
      let response = await this.dataService.save({signal: data}, 'verifications', 'verify').toPromise();
      this.result = response;
    }
    catch(error) {
      console.log(error);
    }
  }
}
