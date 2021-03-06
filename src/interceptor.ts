import { Request, RequestOptionsArgs } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import { InterceptorRequest } from './interceptor-request';
import { InterceptorRequestOptionsArgs } from './interceptor-request-options-args';
import { InterceptorResponseWrapper } from './interceptor-response-wrapper';

/**
 * Represents an intermediary in the interceptor chain that intercept both HTTP request & response flow
 *
 * Implementors will have the ability to
 * 1. Modify the request the along the chain/perform operations such as logging/caching/tranformations; such as adding a header
 * 2. Modify the response along the chain
 * 3. Intercept errors; Can chose to cascade/generate responses
 * 4. Short circuit complete request flow dynamically based on the dynamic conditions without affecting the actual controller/service
 * 5. Ability to perform custom logic; such as redirecting the users to login page,\
 *  if the server returns 401, transparantly without polluting all your services
 *
 * NOTE: Never store any data that's request specific as properties on the Interceptor implementation,
 * as the interceptor instance is shared across all http requests within the application.
 * Instead use `InterceptorRequestOptionsArgs.sharedData` (or) `InterceptorRequest.sharedData` (or) `InterceptorResponseWrapper.sharedData`
 * as request private storage
 */
export interface Interceptor {
  /**
   * Invoked once for each of the interceptors in the chain; in the order defined in the chain,\
   *  unless any of the earlier interceptors asked to complete the flow/return response/throw error to subscriber
   *
   * Gives the ability to transform the request
   */
  beforeRequest?(
    request: InterceptorRequest,
    interceptorStep: number,
    requestNum?: number
  ): Observable<InterceptorRequest> | InterceptorRequest | void;

  /**
   * Invoked once for each of the interceptors in the chain; in the reverse order of chain,\
   *  unless any of the earlier interceptors asked to complete the flow/short the circuit/return response/throw error to subscriber
   *
   * Set any of the following properties of `InterceptorResponseWrapper` to be able to change the way response to sent to subscriber
   * a. `forceReturnResponse` - will send the `Response` to the subscriber directly by skipping all intermediate steps
   * b. `forceRequestCompletion` - will send completion event, so that complete(..) will be invoked on the subscriber
   *
   * You can know if the respons is generated by short circuit handler/err handler,\
   *  by looking at the `responseGeneratedByShortCircuitHandler` & `responseGeneratedByErrHandler` flags
   */
  onResponse?(
    response: InterceptorResponseWrapper,
    interceptorStep: number,
    requestNum?: number
  ): Observable<InterceptorResponseWrapper> | InterceptorResponseWrapper | void;

  /**
   * Invoked once for each of the interceptors in the chain; in the reverse order of chain,\
   *  if any of the `beforeRequest(..)` responded by setting `shortCircuitAtCurrentStep` property of `InterceptorRequest`
   * Use this method to generate a response that gets sent to the subscriber.
   * The result returned by the first interceptor(last in the response flow) would be sent to the subscriber via next(..) callback
   * If no `onShortCircuit(..)` handlers before this handler returns any response/force request to complete
   * An error will be thrown back to the subscriber
   */
  onShortCircuit?(
    response: InterceptorResponseWrapper,
    interceptorStep: number,
    requestNum?: number
  ): Observable<InterceptorResponseWrapper> | InterceptorResponseWrapper | void;

  /**
   * Invoked when the flow encounters any error along the interceptor chain.
   * Use this method to generate a response that gets sent to the subscriber. `response.err` will contain th actual error
   * If you return nothing, the `onErr(..) will be cascaded along the interceptor chain
   * If you return an Observable<InterceptorResponseWrapper> | InterceptorResponseWrapper
   *  & the final interceptor in the result chain (first interceptor) would be sent to the subscriber via next(..) callback
   * If no `onErr(..)` handlers before the first interceptor (last in the response cycle)
   * handler returns any response, the error will be thrown back to the subscriber
   */
  onErr?(
    response: InterceptorResponseWrapper,
    interceptorStep: number,
    requestNum?: number
  ): Observable<InterceptorResponseWrapper> | InterceptorResponseWrapper | void;

  /**
   * Invoked when any one in the interceptor chain forces request completion/return response/error
   * Use this method to perform operations that should be performed irrespective of what the other interceptors in the chain does
   * such as stopping progress bar/logging
   */
  onForceCompleteOrForceReturn?(
    response: InterceptorResponseWrapper,
    interceptorStep: number,
    requestNum?: number
  ): void;

  /**
   * Invoked when the user unsubscribes while the request is still being handled
   * Use this method to perform cleanup operations that should be performed when the request is cancelled by user
   * such as stopping progress bar.
   * NOTE: This method would be invoked even if none of the other handler methods are called on the interceptor.
   * So, always do null checks in this handler
   */
  onUnsubscribe?(
    interceptorStep: number,
    url: string | Request,
    options: RequestOptionsArgs | InterceptorRequestOptionsArgs,
    requestNum?: number
  ): void;
}
