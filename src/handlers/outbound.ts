import serverless from "serverless-http";
import axios, { AxiosRequestConfig, AxiosRequestHeaders, Method } from "axios";
import express, { NextFunction, Request, Response } from "express";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import cors from "cors";
import multer from "multer";
import FormData, { AppendOptions } from "form-data";
import { BlueboxRule, decodeWithRules } from "../bluebox";
import rules from "../../config/replacementRules.json";

const storage = multer.memoryStorage();
const upload = multer({ storage });

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(upload.any());

app.use(function (req: Request, res: Response, next: NextFunction) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header(
    "Access-Control-Allow-Methods",
    "GET,PUT,POST,DELETE,PATCH,OPTIONS"
  );
  next();
});

function mergeHeaders(
  ...headersArray: Record<string, any>[]
): AxiosRequestHeaders {
  return Object.assign({}, ...headersArray) as AxiosRequestHeaders;
}

app.all("*", async (req: Request, res: Response) => {
  const target = req.header("x-bluebox-target");

  if (!target) {
    return res.status(403).send({ error: "Missing x-bluebox-target header" });
  }

  const decode = decodeWithRules({ rules: rules as BlueboxRule[] });
  const commonHeaders = { "x-forwarded-for": "0.0.0.0" };

  delete req.headers.host;
  delete req.headers["content-length"];
  delete req.headers["x-bluebox-target"];

  let axiosConfigRequest: AxiosRequestConfig;

  if (
    req.files &&
    req.header("content-type")?.includes("multipart/form-data")
  ) {
    const formData = new FormData();
    for (let file of req.files as Express.Multer.File[]) {
      const {
        fieldname,
        buffer: value,
        originalname: filename,
        mimetype: contentType,
      } = file;
      const options: AppendOptions = {
        filename,
        contentType,
      };
      formData.append(fieldname, value, options);
    }
    const maskedQuery = await decode(req.query);
    axiosConfigRequest = {
      method: req.method as Method,
      headers: mergeHeaders(req.headers, formData.getHeaders(), commonHeaders),
      params: maskedQuery,
      url: target,
      data: formData,
    };
  } else {
    const maskedBody = await decode(req.body);
    const maskedHeaders = (await decode(req.headers)) as AxiosRequestHeaders;
    const maskedQuery = await decode(req.query);

    axiosConfigRequest = {
      method: req.method as Method,
      headers: mergeHeaders(maskedHeaders, commonHeaders),
      params: maskedQuery,
      url: target,
      data: maskedBody,
    };
  }

  try {
    const response = await axios({ ...axiosConfigRequest, maxRedirects: 0 });
    return res.status(response.status).send(response.data);
  } catch (ex: any) {
    if (ex.response) {
      return res.status(ex.response.status).json(ex.response.data).send();
    } else {
      console.error(
        `Unhandled exception in bluebox outbound: ${ex.message}`,
        ex
      );
      throw ex;
    }
  }
});

export const blueboxOutboundApp = app;

export const handler = serverless(app, {
  binary: ["image/*"],
  request: function (req: Request, event: any, context: any) {
    context.callbackWaitsForEmptyEventLoop = false;
  },
});
