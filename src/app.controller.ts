import { Body, Controller, Get, Post, Headers, } from '@nestjs/common';
import { AppService } from './app.service';
import * as qs from 'qs';
import { HttpService } from '@nestjs/axios';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService,
    private httpService: HttpService) { }
  key = "";


  @Post('/webhook')
  webhook(@Body() data, @Headers() headers) {
    console.log("headers : ", headers['x-gitlab-token']);
    const gitlabkey = headers['x-gitlab-token'];

    console.log("gitlab from object : ", JSON.stringify(data));
    if (gitlabkey === this.key) {

      console.log('test');
      let message = this.checkMessage(data);

      this.call(message).subscribe(res => {
        console.log("res:", res.data);
      });
      // call line notify
    } else {

    }

  }


  call(data) {
    return this.httpService
      .post('https://notify-api.line.me/api/notify', qs.stringify({ message: data }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Bearer XXXXXXXXXXXXXXXXXXXXXXXXXX`
        }
      });
  }

  checkMessage(data): string {
    let message = '';
    let commitMessage = '';
    let commiTitle = '';

    switch (data.object_kind) {
      case 'pipeline':

        commitMessage = data.commit.message
        commiTitle = data.commit.title
        message = `\n行為: 打包 \n\n註解抬頭 :\n ${commiTitle} \n\n註解內容 :\n ${commitMessage}\n\n`

        data.builds.forEach((element, i) => {
          message += `----------------\n`;
          message += `[${i + 1}]打包階段:\n ${element.stage}  \n\n打包結果:\n  ${element.status}  \n\n耗時:\n  ${element.duration}  \n\n`
          element.stage = element.status = element.duration

        });
        message += `----------------\n`;

        break;
      case 'push':
        commitMessage = data.commits[0].message
        commiTitle = data.commits[0].title
        message = `\n行為: 推送  \n\n註解抬頭 :\n ${commiTitle} \n\n註解內容 :\n ${commitMessage} \n\n`
        break;
    }

    return message;
  }
}
