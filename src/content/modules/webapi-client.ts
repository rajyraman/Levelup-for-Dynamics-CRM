// Web API client module using dynamics-web-api for all Dynamics 365 Web API operations

/// <reference types="xrm" />

import { DynamicsWebApi, RetrieveMultipleRequest } from 'dynamics-web-api';
import { WebApiRecord, WebApiResponse, WebApiParameters } from '#types/global';

interface ImpersonationUser {
  systemuserid: string;
  azureactivedirectoryobjectid: string;
  fullname: string;
  internalemailaddress: string;
  domainname: string;
}

interface SearchResult {
  users: ImpersonationUser[];
  hasMoreResults: boolean;
  totalResultsMessage?: string;
}

/**
 * Web API client using dynamics-web-api for all Dynamics 365 operations
 */
export class WebApiClient {
  private static instance: WebApiClient;
  private dwa: DynamicsWebApi | null = null;
  private initialized: boolean = false;

  private constructor() {
    this.initializeDynamicsWebApi();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): WebApiClient {
    if (!WebApiClient.instance) {
      WebApiClient.instance = new WebApiClient();
    }
    return WebApiClient.instance;
  }

  /**
   * Initialize dynamics-web-api with current context
   */
  private initializeDynamicsWebApi(): void {
    try {
      const globalContext = Xrm.Utility.getGlobalContext();
      const clientUrl = globalContext.getClientUrl();

      const config = {
        serverUrl: clientUrl,
        version: '9.2',
        impersonate: undefined, // Will be set by background script via headers
      };

      this.dwa = new DynamicsWebApi(config);
      this.initialized = true;
      console.log('DynamicsWebApi initialized successfully');
    } catch (error) {
      console.warn('Failed to initialize dynamics-web-api, falling back to fetch:', error);
      this.initialized = false;
      this.dwa = null;
    }
  }

  /**
   * Ensure the client is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initializeDynamicsWebApi();
    }
    if (!this.initialized) {
      throw new Error('WebAPI client is not initialized');
    }
  }

  /**
   * Search for users by name or email with result truncation notifications
   */
  async searchUsers(query: string): Promise<SearchResult> {
    try {
      console.log('🔍 [WebApiClient] searchUsers called with query:', query);
      await this.ensureInitialized();
      console.log(
        '🔍 [WebApiClient] Initialization complete, initialized:',
        this.initialized,
        'dwa:',
        !!this.dwa
      );

      if (this.initialized && this.dwa) {
        console.log('🔍 [WebApiClient] Using DWA search method');
        return await this.searchUsersWithDwa(query);
      } else {
        console.log('🔍 [WebApiClient] Using fetch search method');
        return await this.searchUsersWithFetch(query);
      }
    } catch (error) {
      console.warn('🔍 [WebApiClient] DWA search failed, falling back to fetch:', error);
      return await this.searchUsersWithFetch(query);
    }
  }

  /**
   * Search users using dynamics-web-api
   */
  private async searchUsersWithDwa(query: string): Promise<SearchResult> {
    console.log('🔍 [WebApiClient] searchUsersWithDwa called with query:', query);

    if (!this.dwa) {
      throw new Error('DynamicsWebApi not initialized');
    }

    const escapedQuery = query.replace(/'/g, "''");
    const searchFilter = `(contains(fullname,'${escapedQuery}') or contains(internalemailaddress,'${escapedQuery}') or contains(domainname,'${escapedQuery}'))`;
    console.log('🔍 [WebApiClient] DWA search filter:', searchFilter);

    const searchLimit = 10;
    const displayLimit = 5;

    try {
      // Get count (optional, may fail in some environments)
      let totalCount: number | null = null;
      try {
        console.log('🔍 [WebApiClient] Attempting to get count with DWA...');
        totalCount = await this.dwa.count({
          collection: 'systemusers',
          filter: searchFilter,
        });
        console.log('🔍 [WebApiClient] DWA count result:', totalCount);
      } catch (countError) {
        console.warn('🔍 [WebApiClient] Could not get count, continuing without it:', countError);
      }

      // Get results
      console.log('🔍 [WebApiClient] Attempting to retrieve users with DWA...');
      const resultsResponse = await this.dwa.retrieveMultiple({
        collection: 'systemusers',
        select: [
          'systemuserid',
          'azureactivedirectoryobjectid',
          'fullname',
          'internalemailaddress',
          'domainname',
        ],
        filter: searchFilter,
        orderBy: ['fullname'],
        top: searchLimit,
      });

      console.log('🔍 [WebApiClient] DWA response:', resultsResponse);

      const allUsers = (resultsResponse.value || []) as ImpersonationUser[];
      console.log('🔍 [WebApiClient] DWA users array length:', allUsers.length);
      console.log('🔍 [WebApiClient] DWA sample users:', allUsers.slice(0, 3));
      const hasMoreResults =
        allUsers.length >= searchLimit || (totalCount !== null && totalCount > displayLimit);
      const displayedUsers = allUsers.slice(0, displayLimit);

      let totalResultsMessage: string | undefined;
      if (displayedUsers.length === 0) {
        totalResultsMessage = 'No users found matching your search criteria.';
      } else if (hasMoreResults) {
        if (totalCount !== null && totalCount > displayLimit) {
          totalResultsMessage = `Showing first ${displayLimit} of ${totalCount} total users. Refine your search for more specific results.`;
        } else {
          totalResultsMessage = `Showing first ${displayLimit} users. There may be more results. Refine your search for more specific results.`;
        }
      } else {
        // Don't show a message when all results are displayed
        totalResultsMessage = '';
      }

      return {
        users: displayedUsers,
        hasMoreResults,
        totalResultsMessage,
      };
    } catch (error) {
      console.error('Error in DWA search:', error);
      throw error;
    }
  }

  /**
   * Fallback search using fetch API
   */
  private async searchUsersWithFetch(query: string): Promise<SearchResult> {
    console.log('🔍 [WebApiClient] searchUsersWithFetch called with query:', query);
    const globalContext = Xrm.Utility.getGlobalContext();
    const clientUrl = globalContext.getClientUrl();
    console.log('🔍 [WebApiClient] Client URL:', clientUrl);

    const escapedQuery = query.replace(/'/g, "''");
    const filter = `(contains(fullname,'${escapedQuery}') or contains(internalemailaddress,'${escapedQuery}') or contains(domainname,'${escapedQuery}'))`;
    const select =
      'systemuserid,azureactivedirectoryobjectid,fullname,internalemailaddress,domainname';
    const orderby = 'fullname asc';

    console.log('🔍 [WebApiClient] Search filter:', filter);

    const searchLimit = 25;
    const displayLimit = 20;

    // Try to get count first (optional)
    let totalCount: number | null = null;
    try {
      const countUrl = `${clientUrl}/api/data/v9.2/systemusers/$count?$filter=${encodeURIComponent(filter)}`;
      console.log('🔍 [WebApiClient] Count URL:', countUrl);
      const countResponse = await fetch(countUrl, {
        method: 'GET',
        headers: {
          Accept: 'text/plain',
          'OData-MaxVersion': '4.0',
          'OData-Version': '4.0',
        },
      });

      if (countResponse.ok) {
        const countText = await countResponse.text();
        totalCount = parseInt(countText, 10);
        console.log('🔍 [WebApiClient] Total count:', totalCount);
      }
    } catch (countError) {
      console.warn(
        '🔍 [WebApiClient] Could not get total count, continuing without it:',
        countError
      );
    }

    // Get the actual results
    const resultsUrl = `${clientUrl}/api/data/v9.2/systemusers?$filter=${encodeURIComponent(filter)}&$select=${select}&$orderby=${orderby}&$top=${searchLimit}`;
    console.log('🔍 [WebApiClient] Results URL:', resultsUrl);

    const response = await fetch(resultsUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
      },
    });

    console.log('🔍 [WebApiClient] Response status:', response.status);
    console.log('🔍 [WebApiClient] Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔍 [WebApiClient] Error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('🔍 [WebApiClient] Raw response data:', data);

    const allUsers = (data.value || []) as ImpersonationUser[];
    console.log('🔍 [WebApiClient] Parsed users array length:', allUsers.length);
    console.log('🔍 [WebApiClient] Sample users:', allUsers.slice(0, 3));

    const hasMoreResults =
      allUsers.length >= searchLimit || (totalCount !== null && totalCount > displayLimit);
    const displayedUsers = allUsers.slice(0, displayLimit);

    let totalResultsMessage: string | undefined;
    if (displayedUsers.length === 0) {
      totalResultsMessage = 'No users found matching your search criteria.';
    } else if (hasMoreResults) {
      if (totalCount !== null && totalCount > displayLimit) {
        totalResultsMessage = `Showing first ${displayLimit} of ${totalCount} matching users. Refine your search for more specific results.`;
      } else {
        totalResultsMessage = `Showing first ${displayLimit} users. There may be more results. Refine your search for more specific results.`;
      }
    } else {
      // Don't show a message when all results are displayed
      totalResultsMessage = '';
    }

    return {
      users: displayedUsers,
      hasMoreResults,
      totalResultsMessage,
    };
  }

  /**
   * Retrieve a single record by ID
   */
  async retrieveRecord(entityName: string, recordId: string, select?: string[]): Promise<any> {
    try {
      await this.ensureInitialized();

      if (this.initialized && this.dwa) {
        return await this.dwa.retrieve({
          collection: entityName,
          key: recordId,
          select: select,
          includeAnnotations: '*',
        });
      } else {
        return await this.retrieveRecordWithFetch(entityName, recordId, select);
      }
    } catch (error) {
      console.warn('DWA retrieve failed, falling back to fetch:', error);
      return await this.retrieveRecordWithFetch(entityName, recordId, select);
    }
  }

  /**
   * Fallback retrieve using fetch
   */
  private async retrieveRecordWithFetch(
    entityName: string,
    recordId: string,
    select?: string[]
  ): Promise<any> {
    const globalContext = Xrm.Utility.getGlobalContext();
    const clientUrl = globalContext.getClientUrl();

    let url = `${clientUrl}/api/data/v9.2/${entityName}(${recordId})`;
    if (select && select.length > 0) {
      url += `?$select=${select.join(',')}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        Prefer: 'odata.include-annotations=*',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Retrieve multiple records
   */
  async retrieveMultiple(
    entityName: string,
    options?: {
      select?: string[];
      filter?: string;
      orderBy?: string[];
      top?: number;
      expand?: string[];
    }
  ): Promise<any> {
    try {
      await this.ensureInitialized();

      if (this.initialized && this.dwa) {
        const dwaOptions: RetrieveMultipleRequest = {
          collection: entityName,
          select: options?.select,
          filter: options?.filter,
          orderBy: options?.orderBy,
          top: options?.top,
          includeAnnotations: '*',
        };

        // Convert expand strings to proper format if provided
        if (options?.expand) {
          dwaOptions.expand = options.expand.map(exp => ({ property: exp }));
        }

        return await this.dwa.retrieveMultiple(dwaOptions);
      } else {
        return await this.retrieveMultipleWithFetch(entityName, options);
      }
    } catch (error) {
      console.warn('DWA retrieveMultiple failed, falling back to fetch:', error);
      return await this.retrieveMultipleWithFetch(entityName, options);
    }
  }

  /**
   * Fallback retrieveMultiple using fetch
   */
  private async retrieveMultipleWithFetch(
    entityName: string,
    options?: {
      select?: string[];
      filter?: string;
      orderBy?: string[];
      top?: number;
      expand?: string[];
    }
  ): Promise<any> {
    const globalContext = Xrm.Utility.getGlobalContext();
    const clientUrl = globalContext.getClientUrl();

    const queryParams: string[] = [];

    if (options?.select) {
      queryParams.push(`$select=${options.select.join(',')}`);
    }
    if (options?.filter) {
      queryParams.push(`$filter=${encodeURIComponent(options.filter)}`);
    }
    if (options?.orderBy) {
      queryParams.push(`$orderby=${options.orderBy.join(',')}`);
    }
    if (options?.top) {
      queryParams.push(`$top=${options.top}`);
    }
    if (options?.expand) {
      queryParams.push(`$expand=${options.expand.join(',')}`);
    }

    let url = `${clientUrl}/api/data/v9.2/${entityName}`;
    if (queryParams.length > 0) {
      url += `?${queryParams.join('&')}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Create a new record
   */
  async createRecord(entityName: string, data: WebApiRecord): Promise<WebApiResponse> {
    try {
      await this.ensureInitialized();

      if (this.initialized && this.dwa) {
        return await this.dwa.create({
          collection: entityName,
          data: data,
        });
      } else {
        return await this.createRecordWithFetch(entityName, data);
      }
    } catch (error) {
      console.warn('DWA create failed, falling back to fetch:', error);
      return await this.createRecordWithFetch(entityName, data);
    }
  }

  /**
   * Fallback create using fetch
   */
  private async createRecordWithFetch(
    entityName: string,
    data: WebApiRecord
  ): Promise<WebApiResponse> {
    const globalContext = Xrm.Utility.getGlobalContext();
    const clientUrl = globalContext.getClientUrl();

    const url = `${clientUrl}/api/data/v9.2/${entityName}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Update a record
   */
  async updateRecord(
    entityName: string,
    recordId: string,
    data: WebApiRecord
  ): Promise<WebApiResponse> {
    try {
      await this.ensureInitialized();

      if (this.initialized && this.dwa) {
        return await this.dwa.update({
          collection: entityName,
          key: recordId,
          data: data,
        });
      } else {
        return await this.updateRecordWithFetch(entityName, recordId, data);
      }
    } catch (error) {
      console.warn('DWA update failed, falling back to fetch:', error);
      return await this.updateRecordWithFetch(entityName, recordId, data);
    }
  }

  /**
   * Fallback update using fetch
   */
  private async updateRecordWithFetch(
    entityName: string,
    recordId: string,
    data: WebApiRecord
  ): Promise<WebApiResponse> {
    const globalContext = Xrm.Utility.getGlobalContext();
    const clientUrl = globalContext.getClientUrl();

    const url = `${clientUrl}/api/data/v9.2/${entityName}(${recordId})`;

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.status === 204 ? { success: true } : await response.json();
  }

  /**
   * Delete a record
   */
  async deleteRecord(entityName: string, recordId: string): Promise<boolean> {
    try {
      await this.ensureInitialized();

      if (this.initialized && this.dwa) {
        await this.dwa.deleteRecord({
          collection: entityName,
          key: recordId,
        });
        return true;
      } else {
        return await this.deleteRecordWithFetch(entityName, recordId);
      }
    } catch (error) {
      console.warn('DWA delete failed, falling back to fetch:', error);
      return await this.deleteRecordWithFetch(entityName, recordId);
    }
  }

  /**
   * Fallback delete using fetch
   */
  private async deleteRecordWithFetch(entityName: string, recordId: string): Promise<boolean> {
    const globalContext = Xrm.Utility.getGlobalContext();
    const clientUrl = globalContext.getClientUrl();

    const url = `${clientUrl}/api/data/v9.2/${entityName}(${recordId})`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return true;
  }

  /**
   * Execute a function
   */
  async executeFunction(
    functionName: string,
    parameters?: WebApiParameters
  ): Promise<WebApiResponse> {
    try {
      await this.ensureInitialized();

      if (this.initialized && this.dwa) {
        // For now, fall back to fetch since dynamics-web-api function execution API might be different
        return await this.executeFunctionWithFetch(functionName, parameters);
      } else {
        return await this.executeFunctionWithFetch(functionName, parameters);
      }
    } catch (error) {
      console.warn('DWA executeFunction failed, falling back to fetch:', error);
      return await this.executeFunctionWithFetch(functionName, parameters);
    }
  }

  /**
   * Fallback executeFunction using fetch
   */
  private async executeFunctionWithFetch(
    functionName: string,
    parameters?: WebApiParameters
  ): Promise<WebApiResponse> {
    const globalContext = Xrm.Utility.getGlobalContext();
    const clientUrl = globalContext.getClientUrl();

    let url = `${clientUrl}/api/data/v9.2/${functionName}`;

    if (parameters) {
      const paramString = Object.keys(parameters)
        .map(key => `${key}=${encodeURIComponent(String(parameters[key]))}`)
        .join('&');
      url += `?${paramString}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Execute FetchXML query
   */
  async executeFetchXml(entityName: string, fetchXml: string): Promise<any> {
    try {
      await this.ensureInitialized();

      if (this.initialized && this.dwa) {
        const result = await this.dwa.fetch({
          collection: entityName,
          fetchXml: fetchXml,
        });
        return {
          entities: result.value || [],
          totalCount: result['@odata.count'] || result.value?.length || 0,
        };
      } else {
        return await this.executeFetchXmlWithFetch(entityName, fetchXml);
      }
    } catch (error) {
      console.warn('DWA executeFetchXml failed, falling back to fetch:', error);
      return await this.executeFetchXmlWithFetch(entityName, fetchXml);
    }
  }

  /**
   * Fallback executeFetchXml using fetch
   */
  private async executeFetchXmlWithFetch(entityName: string, fetchXml: string): Promise<any> {
    const globalContext = Xrm.Utility.getGlobalContext();
    const clientUrl = globalContext.getClientUrl();

    const url = `${clientUrl}/api/data/v9.2/${entityName}?fetchXml=${encodeURIComponent(fetchXml)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      entities: result.value || [],
      totalCount: result['@odata.count'] || result.value?.length || 0,
    };
  }
}
