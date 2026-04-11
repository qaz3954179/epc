import type { CancelablePromise } from "./core/CancelablePromise"
import { OpenAPI } from "./core/OpenAPI"
import { request as __request } from "./core/request"

export interface CodingProjectCreate {
  title: string
  description?: string | null
  blockly_xml: string
  generated_code?: string | null
  thumbnail_url?: string | null
  is_public?: boolean
}

export interface CodingProjectUpdate {
  title?: string | null
  description?: string | null
  blockly_xml?: string | null
  generated_code?: string | null
  thumbnail_url?: string | null
  is_public?: boolean | null
}

export interface CodingProjectPublic {
  id: string
  user_id: string
  title: string
  description?: string | null
  blockly_xml: string
  generated_code?: string | null
  thumbnail_url?: string | null
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface CodingProjectsPublic {
  data: CodingProjectPublic[]
  count: number
}

export class CodingService {
  public static listProjects({
    skip = 0,
    limit = 50,
    publicOnly = false,
  }: {
    skip?: number
    limit?: number
    publicOnly?: boolean
  }): CancelablePromise<CodingProjectsPublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/coding/projects",
      query: {
        skip,
        limit,
        public_only: publicOnly,
      },
    })
  }

  public static getProject({
    projectId,
  }: {
    projectId: string
  }): CancelablePromise<CodingProjectPublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/coding/projects/{project_id}",
      path: {
        project_id: projectId,
      },
    })
  }

  public static createProject({
    requestBody,
  }: {
    requestBody: CodingProjectCreate
  }): CancelablePromise<CodingProjectPublic> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/coding/projects",
      body: requestBody,
      mediaType: "application/json",
    })
  }

  public static updateProject({
    projectId,
    requestBody,
  }: {
    projectId: string
    requestBody: CodingProjectUpdate
  }): CancelablePromise<CodingProjectPublic> {
    return __request(OpenAPI, {
      method: "PUT",
      url: "/api/v1/coding/projects/{project_id}",
      path: {
        project_id: projectId,
      },
      body: requestBody,
      mediaType: "application/json",
    })
  }

  public static deleteProject({
    projectId,
  }: {
    projectId: string
  }): CancelablePromise<{ message: string }> {
    return __request(OpenAPI, {
      method: "DELETE",
      url: "/api/v1/coding/projects/{project_id}",
      path: {
        project_id: projectId,
      },
    })
  }
}
